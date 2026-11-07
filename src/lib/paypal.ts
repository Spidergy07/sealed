// PayPal REST, sandbox only. Disputes and Orders /track have no Server SDK coverage, so everything goes through fetch here.
const BASE = "https://api-m.sandbox.paypal.com";

let cached: { token: string; exp: number } | undefined;

async function token() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const { PAYPAL_CLIENT_ID: id, PAYPAL_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`PayPal token: ${JSON.stringify(j)}`);
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cached.token;
}

export type PpResponse<T = any> = { status: number; debugId: string | null; json: T };

export async function pp<T = any>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<PpResponse<T>> {
  const r = await fetch(BASE + path, {
    method,
    // Content-Type is sent even on body-less POSTs: capture without it returns 415.
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, debugId: r.headers.get("paypal-debug-id"), json };
}

// Multipart POST (dispute evidence). fetch sets the boundary, so no Content-Type here.
export async function ppForm<T = any>(path: string, form: FormData): Promise<PpResponse<T>> {
  const r = await fetch(BASE + path, { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form, cache: "no-store" });
  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, debugId: r.headers.get("paypal-debug-id"), json };
}

// A dispute names the seller capture; the capture's "up" link names the order.
export async function orderIdForCapture(captureId: string) {
  const r = await pp("GET", `/v2/payments/captures/${encodeURIComponent(captureId)}`);
  const up: string | undefined = r.json?.links?.find((l: any) => l.rel === "up")?.href;
  return up?.match(/orders\/([A-Z0-9]+)/)?.[1];
}

export async function refundCapture(captureId: string) {
  return pp("POST", `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {}, { "PayPal-Request-Id": `refund-${captureId}` });
}

const alnum = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, 127);

export async function createOrder(item: { title: string; price: string; serial: string }, returnUrl: string, cancelUrl: string) {
  const value = Number(item.price).toFixed(2);
  return pp("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [{
      description: `${item.title}, serial ${item.serial}`.slice(0, 127),
      amount: { currency_code: "USD", value, breakdown: { item_total: { currency_code: "USD", value } } },
      // Evidence item_id must be alphanumeric, so the SKU is the serial without punctuation.
      items: [{ name: item.title.slice(0, 127), sku: alnum(item.serial) || "ITEM1", quantity: "1", category: "PHYSICAL_GOODS", unit_amount: { currency_code: "USD", value } }],
    }],
    payment_source: { paypal: { experience_context: {
      shipping_preference: "GET_FROM_FILE", user_action: "PAY_NOW", return_url: returnUrl, cancel_url: cancelUrl,
    } } },
  }, { "PayPal-Request-Id": `create-${crypto.randomUUID()}` });
}

export type OrderView = {
  id: string;
  status: string;
  amount?: string;
  title?: string;
  approveUrl?: string;
  shipTo?: { name?: string; address_line_1?: string; address_line_2?: string; admin_area_2?: string; admin_area_1?: string; postal_code?: string; country_code?: string };
  payerEmail?: string;
  captureId?: string;
  captureStatus?: string;
  captureReason?: string;
  capturedAt?: string;
  sellerProtection?: { status?: string; dispute_categories?: string[] };
  debugId: string | null;
};

export function viewOrder(o: any, debugId: string | null): OrderView {
  const pu = o.purchase_units?.[0] ?? {};
  const cap = pu.payments?.captures?.[0];
  return {
    id: o.id,
    status: o.status,
    amount: pu.amount?.value,
    title: pu.items?.[0]?.name ?? pu.description,
    approveUrl: o.links?.find((l: any) => l.rel === "payer-action" || l.rel === "approve")?.href,
    shipTo: pu.shipping ? { name: pu.shipping.name?.full_name, ...pu.shipping.address } : undefined,
    payerEmail: o.payer?.email_address ?? o.payment_source?.paypal?.email_address,
    captureId: cap?.id,
    captureStatus: cap?.status,
    captureReason: cap?.status_details?.reason,
    capturedAt: cap?.create_time,
    sellerProtection: cap?.seller_protection,
    debugId,
  };
}

// Reads the order and captures it once the buyer has approved. The request id makes a repeat capture a no-op.
export async function syncOrder(id: string): Promise<OrderView> {
  let r = await pp("GET", `/v2/checkout/orders/${encodeURIComponent(id)}`);
  if (r.status === 404) throw new Error("Order not found in sandbox");
  if (r.json.status === "APPROVED") {
    const c = await pp("POST", `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, undefined, { "PayPal-Request-Id": `capture-${id}` });
    // The capture response leaves out items and amount, so read the full order again.
    if (c.status < 300) r = await pp("GET", `/v2/checkout/orders/${encodeURIComponent(id)}`);
  }
  if (r.status >= 300) throw new Error(`PayPal ${r.status} debug_id ${r.debugId}: ${JSON.stringify(r.json).slice(0, 300)}`);
  return viewOrder(r.json, r.debugId);
}

// Orders v2 tracking (the toolkit's tracker tool posts to legacy trackers-batch and ignores errors[]),
// then PayPal's own tracker list as proof the number is on the transaction.
export async function addTracking(orderId: string, captureId: string, trackingNumber: string, carrier: string) {
  const push = await pp("POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/track`, {
    capture_id: captureId,
    tracking_number: trackingNumber,
    carrier,
    notify_payer: true,
  }, { "PayPal-Request-Id": `track-${captureId}-${trackingNumber}` });
  const back = await listTrackers(captureId);
  return {
    ok: push.status < 300,
    pushStatus: push.status,
    pushDebugId: push.debugId,
    error: push.status < 300 ? undefined : JSON.stringify(push.json).slice(0, 300),
    readBackDebugId: back.debugId,
    onPayPal: back.trackers,
  };
}

export async function listTrackers(captureId: string) {
  const r = await pp("GET", `/v1/shipping/trackers?transaction_id=${encodeURIComponent(captureId)}`);
  const trackers = ((r.json?.trackers ?? []) as any[]).map(t => ({
    number: t.tracking_number as string, carrier: t.carrier as string, status: t.status as string, shipmentDate: t.shipment_date as string | undefined,
  }));
  return { debugId: r.debugId, trackers };
}

// verify-webhook-signature answers 200 even for bad signatures, so the decision is on verification_status.
export async function verifyWebhook(headers: Headers, event: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return { verified: false, reason: "PAYPAL_WEBHOOK_ID not set" };
  const r = await pp("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: event,
  });
  return { verified: r.json?.verification_status === "SUCCESS", reason: r.json?.verification_status ?? `http ${r.status}`, debugId: r.debugId };
}
