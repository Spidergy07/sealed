// Day-0 sandbox checks for Sealed. Run: node --env-file=.env.local scripts/day0.mjs <step>
// Steps: token | orders | capture | track | webhooks | all-after-approve
// State is kept in scripts/day0-state.json, findings appended to docs/sandbox-findings.md.
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";

const BASE = "https://api-m.sandbox.paypal.com"; // sandbox only, live credentials will fail auth
const STATE = new URL("./day0-state.json", import.meta.url);
const FINDINGS = new URL("../docs/sandbox-findings.md", import.meta.url);
const { PAYPAL_CLIENT_ID: id, PAYPAL_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (sandbox) in .env.local");

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { orders: [] };
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2));

function note(title, obj) {
  mkdirSync(new URL("../docs/", import.meta.url), { recursive: true });
  const line = `\n### ${new Date().toISOString()} ${title}\n\n\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\`\n`;
  appendFileSync(FINDINGS, line);
  console.log(`\n== ${title}\n`, JSON.stringify(obj, null, 2));
}

async function token() {
  if (state.token && state.tokenExp > Date.now() + 60_000) return state.token;
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  Object.assign(state, { token: j.access_token, tokenExp: Date.now() + j.expires_in * 1000, scope: j.scope });
  save();
  return j.access_token;
}

async function pp(method, path, body, extra = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", ...extra },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, debug_id: r.headers.get("paypal-debug-id"), json };
}

const steps = {
  async token() {
    await token();
    const need = ["shipping/trackers/readwrite", "disputes"];
    note("token scopes", { has: need.map(s => [s, state.scope.includes(s)]), expires_in_h: ((state.tokenExp - Date.now()) / 3.6e6).toFixed(1) });
  },

  // Creates 4 G&S orders. The sandbox buyer must open each approve link and pay with PayPal balance.
  async orders() {
    const prices = ["780.00", "780.00", "640.00", "11.50"];
    for (const [i, value] of prices.entries()) {
      const res = await pp("POST", "/v2/checkout/orders", {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `day0-${i + 1}`,
          description: "Used RTX 4080 FE, serial GPU4080FE00" + i,
          amount: { currency_code: "USD", value, breakdown: { item_total: { currency_code: "USD", value } } },
          items: [{ name: "Used RTX 4080 Founders Edition", sku: `GPU4080FE00${i}`, quantity: "1", category: "PHYSICAL_GOODS", unit_amount: { currency_code: "USD", value } }],
        }],
        payment_source: { paypal: { experience_context: {
          shipping_preference: "GET_FROM_FILE", user_action: "PAY_NOW",
          return_url: "https://example.com/return", cancel_url: "https://example.com/cancel",
        } } },
      }, { "PayPal-Request-Id": `day0-create-${i + 1}-${Date.now()}` });
      const approve = res.json.links?.find(l => l.rel === "payer-action" || l.rel === "approve")?.href;
      state.orders[i] = { id: res.json.id, value, approve, status: res.json.status };
      note(`order ${i + 1} create`, { http: res.status, debug_id: res.debug_id, id: res.json.id, status: res.json.status, approve });
    }
    save();
    console.log("\nOpen each approve link, log in as the US sandbox PERSONAL buyer, pay with balance, then run: capture");
  },

  async capture() {
    for (const o of state.orders) {
      if (!o?.id || o.captureId) continue;
      const res = await pp("POST", `/v2/checkout/orders/${o.id}/capture`, null, { "PayPal-Request-Id": `day0-cap-${o.id}` });
      const pu = res.json.purchase_units?.[0];
      const cap = pu?.payments?.captures?.[0];
      Object.assign(o, { captureId: cap?.id, captureStatus: cap?.status, shipTo: pu?.shipping?.address, sellerProtection: cap?.seller_protection });
      note(`capture ${o.id}`, { http: res.status, debug_id: res.debug_id, capture: cap?.id, status: cap?.status, seller_protection: cap?.seller_protection, ship_to: pu?.shipping, error: res.status >= 300 ? res.json : undefined });
    }
    save();
  },

  // Order 1: Orders v2 /track then read back. Order 2: legacy trackers-batch, check errors[] even on HTTP 200.
  async track() {
    const [o1, o2] = state.orders;
    if (o1?.captureId) {
      const res = await pp("POST", `/v2/checkout/orders/${o1.id}/track`, {
        capture_id: o1.captureId, tracking_number: "9400111899223197428490", carrier: "USPS", notify_payer: true,
      }, { "PayPal-Request-Id": `day0-track-${o1.id}` });
      note("orders /track (order 1)", { http: res.status, debug_id: res.debug_id, body: res.json });
      const back = await pp("GET", `/v1/shipping/trackers?transaction_id=${o1.captureId}`);
      note("trackers read-back (order 1)", { http: back.status, debug_id: back.debug_id, body: back.json });
    }
    if (o2?.captureId) {
      const res = await pp("POST", "/v1/shipping/trackers-batch", {
        trackers: [{ transaction_id: o2.captureId, tracking_number: "1Z999AA10123456784", status: "SHIPPED", carrier: "UPS" }],
      });
      note("trackers-batch (order 2)", { http: res.status, debug_id: res.debug_id, errors: res.json.errors, body: res.json });
    }
  },

  async webhooks() {
    const res = await pp("GET", "/v1/notifications/webhooks");
    note("webhooks on app", { http: res.status, webhooks: res.json.webhooks?.map(w => ({ id: w.id, url: w.url, events: w.event_types.map(e => e.name) })) });
  },

  async "all-after-approve"() { await steps.capture(); await steps.track(); await steps.webhooks(); },
};

const step = process.argv[2];
if (!steps[step]) { console.log("Usage: node --env-file=.env.local scripts/day0.mjs " + Object.keys(steps).join(" | ")); process.exit(1); }
await steps[step]();
