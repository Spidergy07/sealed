// Dispute half: evidence facts to notes and PDF, coverage triage. No network: fetch is stubbed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPdf, templateNotes, timeline, writeNotes, type Facts } from "../src/lib/evidence.ts";
import { coverage, viewDispute } from "../src/lib/disputes.ts";

const base: Facts = {
  dispute: { id: "PP-R-SQX-10196993", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", stage: "INQUIRY", status: "WAITING_FOR_SELLER_RESPONSE", amount: "640.00", openedAt: "2026-11-07T14:01:50Z", buyerSays: ["Package never arrived."], requested: ["PROOF_OF_FULFILLMENT"] },
  sale: { orderId: "66425252S3919764L", item: "Used RTX 4080", serial: "GPU-1", amount: "640.00", captureId: "9JN43155RM2635829", paidAt: "2026-11-07T13:56:12Z", captureStatusNow: "PENDING BUYER_COMPLAINT", protectionAtCapture: "ELIGIBLE", categories: ["ITEM_NOT_RECEIVED"] },
  shipTo: { name: "Jordan Buyer", address_line_1: "2211 N First St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131" },
  tracking: [{ number: "9405500208192110884461", carrier: "USPS", status: "SHIPPED", shipmentDate: "2026-11-07" }],
  dmFlags: [],
};

function stubModel(text: string) {
  process.env.OPENROUTER_API_KEY = "test";
  process.env.GEMINI_API_KEY = ""; process.env.TYPHOON_API_KEY = "";
  globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 })) as typeof fetch;
}

test("notes that claim a label check the record does not have fall back to the template", async () => {
  stubModel("Shipped to 2211 N First St, San Jose CA 95131. USPS 9405500208192110884461. The label was checked against the Transaction Details address.");
  const r = await writeNotes(base);
  assert.match(r.by, /^template/);
  assert.doesNotMatch(r.notes, /label/i);
});

test("notes missing the tracking number are dropped", async () => {
  stubModel("Shipped to San Jose CA 95131 by USPS.");
  assert.match((await writeNotes(base)).by, /missing 9405500208192110884461/);
});

test("good notes are kept, and claiming delivery without a DELIVERED tracker is not", async () => {
  stubModel("Shipped to 2211 N First St, San Jose CA 95131 with USPS tracking 9405500208192110884461, status SHIPPED. See the PDF.");
  assert.equal((await writeNotes(base)).by, "openrouter/nvidia/nemotron-3.5-super-vl:free");
  stubModel("USPS 9405500208192110884461 was delivered to San Jose 95131.");
  assert.match((await writeNotes(base)).by, /claims delivery/);
});

test("timeline and PDF come from facts only and fit PayPal's limits", async () => {
  const rows = timeline({ ...base, label: { readAt: "2026-11-07T13:57:00Z", zip: "95131", matchesShipTo: true, photoSha256: "ab".repeat(32) } });
  assert.equal(rows.length, 4);
  assert.ok(templateNotes(base).length <= 2000);
  const pdf = await buildPdf(base, "Notes with a curly quote “ok” and a dash — fine.");
  assert.equal(Buffer.from(pdf.slice(0, 5)).toString(), "%PDF-");
  assert.ok(pdf.length < 10 * 1024 * 1024);
});

test("coverage triage: INR flagged at capture, SNAD and card-issuer cases are not covered", () => {
  const d = viewDispute({ dispute_id: "X", reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED", dispute_channel: "INTERNAL", evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", source: "REQUESTED_FROM_SELLER" }], links: [{ rel: "provide_evidence" }] });
  assert.deepEqual(d.requested, ["PROOF_OF_FULFILLMENT"]);
  assert.equal(coverage(d, ["ITEM_NOT_RECEIVED"])[0].rule.id, "inr_delivery");
  assert.equal(coverage({ ...d, channel: "EXTERNAL" })[0].rule.id, "card_inr");
  assert.equal(coverage({ ...d, reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED" })[0].rule.id, "snad");
});
