"use server";
import { fileEvidence, getDispute, observe, saleFor, saveFiling } from "@/lib/disputes";
import { buildPdf, gatherFacts, pdfName, writeNotes } from "@/lib/evidence";
import { get, put } from "@/lib/store";

const fail = (e: unknown) => ({ error: (e as Error).message });

async function load(id: string) {
  const d = await getDispute(id);
  const found = await saleFor(d);
  if (!found) throw new Error("No PayPal order found for this case's capture.");
  return { d, ...found };
}

export type DraftResult = { notes: string; by: string } | { error: string };

export async function draftEvidence(id: string): Promise<DraftResult> {
  try {
    const { d, orderId, sale } = await load(id);
    const facts = await gatherFacts(d, orderId, sale);
    const r = await writeNotes(facts);
    const fresh = (await get("sales", orderId)) ?? sale;
    await put("sales", orderId, { ...fresh, dispute: { ...(fresh.dispute ?? { id, chain: [] }), draft: { ...r, at: new Date().toISOString() } } });
    return r;
  } catch (e) {
    return fail(e);
  }
}

export type FileResult = { ok: boolean; path: string; http: number; debugId: string | null; stage: string; status: string; error?: string } | { error: string };

// Runs only from the approval button. Re-reads the case first so a stale page cannot file on the wrong stage.
export async function fileWithPayPal(id: string, notes: string, approved: boolean): Promise<FileResult> {
  try {
    if (!approved) return { error: "Tick the box to confirm you reviewed the notes and the PDF." };
    const text = notes.trim();
    if (!text || text.length > 2000) return { error: "Notes must be 1 to 2,000 characters (PayPal's limit)." };
    const { d, orderId, sale } = await load(id);
    if (sale.dispute?.filing?.ok) return { error: "Evidence was already filed on this case." };
    const facts = await gatherFacts(d, orderId, sale);
    const pdf = await buildPdf(facts, text);
    const name = pdfName(id);
    const t = facts.tracking[0];
    const r = await fileEvidence(d, { notes: text, pdf, pdfName: name, tracking: t && { number: t.number, carrier: t.carrier } });
    const after = await getDispute(id);
    await saveFiling(orderId, { at: new Date().toISOString(), ...r, notes: text, pdfName: name, pdfBase64: Buffer.from(pdf).toString("base64") }, after);
    return { ok: r.ok, path: r.path, http: r.http, debugId: r.debugId, stage: after.stage, status: after.status, error: r.ok ? undefined : JSON.stringify(r.response).slice(0, 400) };
  } catch (e) {
    return fail(e);
  }
}

export async function refreshCase(id: string) {
  try {
    const d = await getDispute(id);
    const rec = await observe(d, "refresh");
    return { stage: d.stage, status: d.status, chain: rec.chain };
  } catch (e) {
    return fail(e);
  }
}
