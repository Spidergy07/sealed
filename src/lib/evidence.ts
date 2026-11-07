// The evidence pack: facts gathered from PayPal and the packing record, notes a reviewer can read in 30 s,
// and a one-page PDF. The facts and the PDF are plain code; the model only words the notes, and the
// notes are rejected unless they keep the tracking number and ZIP the facts contain.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { chat } from "./llm.ts";
import { listTrackers, syncOrder, type OrderView } from "./paypal.ts";
import type { DisputeView } from "./disputes.ts";

export type Facts = {
  dispute: { id: string; reason: string; stage: string; status: string; amount?: string; openedAt?: string; buyerSays: string[]; requested: string[] };
  sale: { orderId: string; item?: string; serial?: string; amount?: string; captureId?: string; paidAt?: string; captureStatusNow?: string; protectionAtCapture?: string; categories: string[] };
  shipTo?: OrderView["shipTo"];
  label?: { readAt?: string; zip?: string; street?: string; matchesShipTo?: boolean; photoSha256?: string; by?: string; reprintedToZip?: string };
  tracking: { number: string; carrier: string; status: string; shipmentDate?: string }[];
  trackingPushedAt?: string;
  trackingPushDebugId?: string;
  trackerReadDebugId?: string | null;
  dmFlags: string[];
};

export async function gatherFacts(d: DisputeView, orderId: string, sale: any): Promise<Facts> {
  const o = await syncOrder(orderId);
  const t = o.captureId ? await listTrackers(o.captureId) : { debugId: null, trackers: [] };
  const p = sale?.pack ?? {};
  return {
    dispute: { id: d.id, reason: d.reason, stage: d.stage, status: d.status, amount: d.amount, openedAt: d.createdAt, buyerSays: d.buyerNotes, requested: d.requested },
    sale: {
      orderId, item: o.title ?? sale?.title, serial: sale?.serial, amount: o.amount, captureId: o.captureId, paidAt: o.capturedAt,
      captureStatusNow: [o.captureStatus, o.captureReason].filter(Boolean).join(" "),
      protectionAtCapture: o.sellerProtection?.status, categories: o.sellerProtection?.dispute_categories ?? [],
    },
    shipTo: o.shipTo,
    label: p.read ? {
      readAt: p.readAt, zip: p.read.zip ?? undefined, street: p.read.street1 ?? undefined, matchesShipTo: p.compare?.match,
      photoSha256: p.photoSha256, by: p.by, reprintedToZip: p.reprint?.toZip,
    } : undefined,
    tracking: t.trackers,
    trackingPushedAt: p.trackingPush?.at,
    trackingPushDebugId: p.trackingPush?.pushDebugId,
    trackerReadDebugId: t.debugId,
    dmFlags: sale?.dm?.flags ?? [],
  };
}

const date = (s?: string) => (s ? s.slice(0, 16).replace("T", " ") + " UTC" : "unknown");
const addr = (a?: OrderView["shipTo"]) => (a ? `${a.name ?? ""}, ${a.address_line_1 ?? ""}${a.address_line_2 ? " " + a.address_line_2 : ""}, ${a.admin_area_2 ?? ""} ${a.admin_area_1 ?? ""} ${a.postal_code ?? ""}`.trim() : "not on file");

// The timeline both the notes and the PDF are built from.
export function timeline(f: Facts) {
  const rows: [string, string][] = [];
  rows.push([date(f.sale.paidAt), `Buyer paid $${f.sale.amount} with PayPal Goods and Services. Capture ${f.sale.captureId}. PayPal's Seller Protection flag at capture: ${f.sale.protectionAtCapture ?? "none"}.`]);
  if (f.label) rows.push([date(f.label.readAt), `Shipping label photographed at the packing bench (SHA-256 ${f.label.photoSha256?.slice(0, 16)}...). Label ZIP ${f.label.zip ?? "?"}: ${f.label.matchesShipTo ? "matches" : "did not match"} the Transaction Details address.${f.label.reprintedToZip ? ` Label reprinted to the PayPal address, ZIP ${f.label.reprintedToZip}.` : ""}`]);
  for (const t of f.tracking) rows.push([t.shipmentDate ?? date(f.trackingPushedAt), `${t.carrier} tracking ${t.number} added to this PayPal transaction. PayPal tracker status: ${t.status}.`]);
  rows.push([date(f.dispute.openedAt), `Buyer opened ${f.dispute.id}: item not received${f.dispute.buyerSays[0] ? ` ("${f.dispute.buyerSays[0]}")` : ""}.`]);
  return rows;
}

export function templateNotes(f: Facts) {
  const t = f.tracking[0];
  return [
    `The item (${f.sale.item}${f.sale.serial ? `, serial ${f.sale.serial}` : ""}) was shipped to the address on the Transaction Details page: ${addr(f.shipTo)}.`,
    t ? `${t.carrier} tracking ${t.number} is on this PayPal transaction (status ${t.status}).` : "No tracking is on this transaction.",
    f.label ? `The label was photographed before the box was sealed and its ZIP ${f.label.zip} was checked against the PayPal ship-to.` : "",
    "Timeline and details are in the attached one-page PDF.",
  ].filter(Boolean).join(" ");
}

const SYSTEM = `You write the notes a PayPal dispute reviewer reads first. Use ONLY the facts given as JSON.
Write plain sentences, no headings, no bullet symbols, no markdown, at most 900 characters.
Start with what was shipped and to which address, then the carrier and tracking number exactly as given,
then, only if "label" is present in the facts, what the packing-bench check found: if label.matchesShipTo is true, the label matched the Transaction Details address;
if it is false and label.reprintedToZip is set, the first label did not match and a new label was printed to the Transaction Details address before shipping,
then one line pointing to the attached PDF.
Never claim delivery unless a tracker status says DELIVERED. Never mention a label check if "label" is absent. Never invent dates, names or numbers.`;

// Model-worded notes, kept only if they still contain the tracking number and the ship-to ZIP.
export async function writeNotes(f: Facts) {
  const must = [f.tracking[0]?.number, f.shipTo?.postal_code?.slice(0, 5)].filter(Boolean) as string[];
  try {
    const r = await chat([{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({ ...f, timeline: timeline(f) }) }], { timeoutMs: 30000 });
    const text = r.text.replace(/[*#`]/g, "").replace(/\s+\n/g, "\n").trim();
    const missing = must.filter(m => !text.includes(m));
    // A label check the record does not have would be a false claim to PayPal.
    if (!f.label && /label/i.test(text)) missing.push("(claims a label check that was not recorded)");
    if (!f.tracking.some(t => t.status === "DELIVERED") && /\bdelivered\b/i.test(text) && !/not (yet )?delivered|no delivered/i.test(text)) missing.push("(claims delivery)");
    if (text.length > 0 && text.length <= 2000 && missing.length === 0) return { notes: text, by: `${r.provider}/${r.model}` };
    return { notes: templateNotes(f), by: `template (model draft dropped: ${missing.length ? `missing ${missing.join(", ")}` : "too long"})` };
  } catch (e) {
    return { notes: templateNotes(f), by: `template (${(e as Error).message.slice(0, 80)})` };
  }
}

// pdf-lib standard fonts are WinAnsi only, so text is folded to plain ASCII first.
const ascii = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, "");

export async function buildPdf(f: Facts, notes: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Evidence ${f.dispute.id}`);
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 750;
  const W = 532;
  const wrap = (text: string, size: number, f2 = font, width = W) => {
    const words = ascii(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f2.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = w; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const text = (s: string, size = 9.5, f2 = font, x = 40, width = W, color = rgb(0.1, 0.1, 0.1)) => {
    for (const l of wrap(s, size, f2, width)) { page.drawText(l, { x, y, size, font: f2, color }); y -= size + 3.5; }
  };
  const head = (s: string) => { y -= 6; text(s, 11, bold); y -= 1; };

  text(`Proof of fulfillment for PayPal case ${f.dispute.id}`, 15, bold);
  text(`${f.sale.item ?? "Item"}${f.sale.serial ? `, serial ${f.sale.serial}` : ""}. $${f.sale.amount}. PayPal order ${f.sale.orderId}, capture ${f.sale.captureId}.`, 9.5, font, 40, W, rgb(0.3, 0.3, 0.3));

  head("Summary");
  text(notes);

  head("Shipped to the Transaction Details address");
  text(`PayPal ship-to: ${addr(f.shipTo)}`);
  if (f.label) text(`Label read at packing: ${f.label.street ?? "?"}, ZIP ${f.label.zip ?? "?"}. Match: ${f.label.matchesShipTo ? "yes" : "no"}${f.label.reprintedToZip ? `, reprinted to ZIP ${f.label.reprintedToZip}` : ""}.`);

  head("Tracking on this PayPal transaction");
  if (f.tracking.length) for (const t of f.tracking) text(`${t.carrier} ${t.number}, status ${t.status}${t.shipmentDate ? `, shipped ${t.shipmentDate}` : ""}`);
  else text("None.");

  head("Timeline");
  for (const [when, what] of timeline(f)) {
    const y0 = y;
    page.drawText(ascii(when), { x: 40, y, size: 8.5, font: bold, color: rgb(0.25, 0.25, 0.25) });
    y = y0;
    text(what, 9, font, 150, W - 110);
    y -= 2;
  }

  head("Record");
  text(`Packing photo SHA-256: ${f.label?.photoSha256 ?? "none"}. Tracking pushed with Orders v2 /track (debug_id ${f.trackingPushDebugId ?? "n/a"}), read back from PayPal's tracker list (debug_id ${f.trackerReadDebugId ?? "n/a"}).`, 8.5);
  text(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by Sealed in the PayPal sandbox.`, 8, font, 40, W, rgb(0.45, 0.45, 0.45));
  return doc.save();
}

export const pdfName = (disputeId: string) => `${disputeId.replace(/[^A-Za-z0-9-]/g, "")}-evidence.pdf`;
