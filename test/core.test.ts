// Run: npm test  (Node 23+ runs .ts directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { dmFlags, orderFlags, sameAddress, type DmFacts } from "../src/lib/rules.ts";
import { chat, parseJson } from "../src/lib/llm.ts";

const shipTo = { address_line_1: "2211 N First St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131" };
const none: DmFacts = { asks_friends_family: false, buyer_arranged_label: false, wants_in_person: false, requested_address: null, quotes: [] };

test("redirect to another address blocks and offers PayPal's refund-and-rebill remedy", () => {
  const ids = dmFlags({ ...none, requested_address: "455 Market St, San Francisco CA 94105" }, shipTo).map(f => f.rule.id);
  assert.deepEqual(ids, ["ship_to_td", "redirect_remedy"]);
});

test("buyer restating the PayPal address is not a redirect", () => {
  assert.equal(sameAddress("2211 N. First Street, San Jose, CA 95131", shipTo), true);
  assert.deepEqual(dmFlags({ ...none, requested_address: "2211 N First St San Jose CA 95131" }, shipTo), []);
});

test("same ZIP but different street number is a redirect", () => {
  assert.equal(sameAddress("99 Other Rd, San Jose CA 95131", shipTo), false);
});

test("buyer label is a warning, F&F is a block", () => {
  const f = dmFlags({ ...none, buyer_arranged_label: true, asks_friends_family: true }, shipTo);
  assert.deepEqual(f.map(x => [x.rule.id, x.rule.severity]), [["friends_family", "block"], ["buyer_label", "warn"]]);
});

test("order checks: pending capture blocks, 7-day window counts down", () => {
  assert.equal(orderFlags({ captureStatus: "PENDING" })[0].rule.id, "hold");
  const now = Date.parse("2026-11-10T00:00:00Z");
  const f = orderFlags({ captureStatus: "COMPLETED", capturedAt: "2026-11-07T00:00:00Z" }, now);
  assert.deepEqual(f.map(x => x.rule.id), ["ship_7_days"]);
  assert.match(f[0].detail, /4 days left/);
});

test("parseJson handles fences and surrounding text", () => {
  assert.deepEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJson('Sure: {"a":2} hope that helps'), { a: 2 });
  assert.equal(parseJson("no json"), undefined);
});

test("chat falls through rate-limited OpenRouter to Gemini, never calls paid models, skips unset keys", async () => {
  const calls: string[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: any) => {
    const model = JSON.parse(init.body).model;
    calls.push(model);
    if (String(url).includes("openrouter")) return new Response("{}", { status: 429 });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const env = { OPENROUTER_API_KEY: "k", OPENROUTER_MODELS: "a:free,paid-model", GEMINI_API_KEY: "g", GEMINI_MODELS: "gem" };
    const r = await chat([{ role: "user", content: "hi" }], { json: true, env });
    assert.equal(r.provider, "gemini");
    assert.deepEqual(calls, ["a:free", "gem"]);
    // second call skips the cooled-down free model
    calls.length = 0;
    await chat([{ role: "user", content: "hi" }], { env });
    assert.deepEqual(calls, ["gem"]);
  } finally {
    globalThis.fetch = real;
  }
});

test("image requests skip text-only Typhoon and fail clearly when nothing is left", async () => {
  const msg = [{ role: "user" as const, content: [{ type: "image_url" as const, image_url: { url: "data:," } }] }];
  await assert.rejects(chat(msg, { env: { TYPHOON_API_KEY: "t" } }), /tried: none/);
});
