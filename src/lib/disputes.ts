// Disputes v1 over fetch (no Server SDK coverage). Every read and write is recorded on the sale, so the
// panel shows the chain PayPal actually returned, with times and debug_ids, not an assumed lifecycle.
import { orderIdForCapture, pp, ppForm } from "./paypal.ts";
import { rule, type Flag } from "./rules.ts";
import { get, put } from "./store.ts";

export type DisputeView = {
  id: string;
  reason: string;
  stage: string;
  status: string;
  channel?: string;
  amount?: string;
  captureId?: string;
  buyerTxnId?: string;
  createdAt?: string;
  dueAt?: string;
  requested: string[]; // evidence types with source REQUESTED_FROM_SELLER
  buyerNotes: string[];
  links: string[];
  debugId: string | null;
};

export function viewDispute(j: any, debugId: string | null = null): DisputeView {
  const ev: any[] = j.evidences ?? [];
  return {
    id: j.dispute_id,
    reason: j.reason,
    stage: j.dispute_life_cycle_stage,
    status: j.status,
    channel: j.dispute_channel,
    amount: j.dispute_amount?.value,
    captureId: j.disputed_transactions?.[0]?.seller_transaction_id,
    buyerTxnId: j.disputed_transactions?.[0]?.buyer_transaction_id,
    createdAt: j.create_time,
    dueAt: j.seller_response_due_date,
    requested: ev.filter(e => e.source === "REQUESTED_FROM_SELLER").map(e => e.evidence_type),
    buyerNotes: ev.filter(e => e.source === "SUBMITTED_BY_BUYER" && e.notes).map(e => e.notes),
    // Rels use underscores and their order varies, so look them up by name only.
    links: (j.links ?? []).map((l: any) => l.rel),
    debugId,
  };
}

export async function getDispute(id: string) {
  const r = await pp("GET", `/v1/customer/disputes/${encodeURIComponent(id)}`);
  if (r.status >= 300) throw new Error(`PayPal ${r.status} debug_id ${r.debugId}: ${JSON.stringify(r.json).slice(0, 300)}`);
  return viewDispute(r.json, r.debugId);
}

// The list lags new cases by 10 to 50 min in sandbox; webhooks are the fast path.
export async function listDisputes() {
  const r = await pp("GET", "/v1/customer/disputes?page_size=20");
  return { debugId: r.debugId, items: ((r.json?.items ?? []) as any[]).map(x => viewDispute(x)) };
}

export type ChainStep = { at: string; stage: string; status: string; via: string; debugId?: string | null };
export type Filing = { at: string; path: "provide-evidence" | "provide-supporting-info"; http: number; debugId: string | null; ok: boolean; response: unknown; notes: string; pdfName: string; pdfBase64?: string };
export type DisputeRecord = { id: string; captureId?: string; reason?: string; chain: ChainStep[]; filing?: Filing; draft?: { notes: string; by: string; at: string } };

// Finds the sale for a dispute (capture to order), creating a bare one for orders made outside the app.
export async function saleFor(d: Pick<DisputeView, "id" | "captureId">) {
  const pointer = await get("events", `dispute-${d.id}`);
  let orderId: string | undefined = pointer?.orderId;
  if (!orderId && d.captureId) {
    orderId = await orderIdForCapture(d.captureId);
    if (orderId) await put("events", `dispute-${d.id}`, { id: `dispute-${d.id}`, type: "DISPUTE_POINTER", orderId });
  }
  if (!orderId) return undefined;
  return { orderId, sale: (await get("sales", orderId)) ?? { id: orderId } };
}

// Appends a step when stage or status changed since the last one, and returns the record.
export async function observe(d: DisputeView, via: string): Promise<DisputeRecord & { orderId?: string }> {
  const found = await saleFor(d);
  const rec: DisputeRecord = found?.sale.dispute?.id === d.id ? found.sale.dispute : { id: d.id, chain: [] };
  const last = rec.chain.at(-1);
  if (!last || last.stage !== d.stage || last.status !== d.status) {
    rec.chain.push({ at: new Date().toISOString(), stage: d.stage, status: d.status, via, debugId: d.debugId });
  }
  Object.assign(rec, { captureId: d.captureId, reason: d.reason });
  if (found) await put("sales", found.orderId, { ...found.sale, dispute: rec });
  return { ...rec, orderId: found?.orderId };
}

export async function saveFiling(orderId: string, filing: Filing, after: DisputeView) {
  const sale = (await get("sales", orderId)) ?? { id: orderId };
  const rec: DisputeRecord = sale.dispute ?? { id: after.id, chain: [] };
  rec.filing = filing;
  rec.chain.push({ at: filing.at, stage: after.stage, status: after.status, via: `after ${filing.path}`, debugId: after.debugId });
  await put("sales", orderId, { ...sale, dispute: rec });
}

// What Seller Protection says about this claim, from the reason and the capture's flag. No model involved.
export function coverage(d: DisputeView, captureCategories: string[] = []): Flag[] {
  if (d.reason === "MERCHANDISE_OR_SERVICE_NOT_RECEIVED") {
    if (d.channel === "EXTERNAL") return [{ rule: rule("card_inr"), detail: "This case came through the buyer's card issuer, so Seller Protection does not apply. You can still respond with your evidence." }];
    const flagged = captureCategories.includes("ITEM_NOT_RECEIVED");
    return [{ rule: rule("inr_delivery"), detail: flagged
      ? "PayPal flagged this capture as eligible for Item Not Received. Protection depends on tracking to the Transaction Details address."
      : "PayPal did not flag this capture as eligible for Item Not Received." }];
  }
  if (d.reason === "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED") return [{ rule: rule("snad"), detail: "Seller Protection does not cover this claim. PayPal decides on the evidence; respond with photos and the listing." }];
  return [];
}

export async function fileEvidence(d: DisputeView, input: { notes: string; tracking?: { number: string; carrier: string }; pdf: Uint8Array; pdfName: string }) {
  const file = new Blob([input.pdf as BlobPart], { type: "application/pdf" });
  const form = new FormData();
  let path: Filing["path"];
  if (d.links.includes("provide_evidence")) {
    path = "provide-evidence";
    const type = d.requested[0] ?? "PROOF_OF_FULFILLMENT";
    form.append("input", new Blob([JSON.stringify({ evidences: [{
      evidence_type: type,
      ...(type === "PROOF_OF_FULFILLMENT" && input.tracking ? { evidence_info: { tracking_info: [{ carrier_name: input.tracking.carrier, tracking_number: input.tracking.number }] } } : {}),
      documents: [{ name: input.pdfName }],
      notes: input.notes,
    }] })], { type: "application/json" }));
    form.append("evidence-file", file, input.pdfName);
  } else if (d.links.includes("provide_supporting_info")) {
    // CHARGEBACK stage refuses PROOF_OF_FULFILLMENT; supporting info is the path PayPal leaves open.
    path = "provide-supporting-info";
    form.append("input", new Blob([JSON.stringify({ notes: input.notes })], { type: "application/json" }));
    form.append("supporting document", file, input.pdfName);
  } else {
    throw new Error(`PayPal offers no evidence action on this case right now (links: ${d.links.join(", ")}).`);
  }
  const r = await ppForm(`/v1/customer/disputes/${encodeURIComponent(d.id)}/${path}`, form);
  return { path, http: r.status, debugId: r.debugId, ok: r.status < 300, response: r.json };
}
