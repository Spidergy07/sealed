import { getDispute, saleFor } from "@/lib/disputes";
import { buildPdf, gatherFacts, pdfName, templateNotes } from "@/lib/evidence";

export const dynamic = "force-dynamic";

// Once filed, serves the exact PDF PayPal received; before that, a preview from the current draft.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDispute(id);
  const found = await saleFor(d);
  if (!found) return new Response("No order for this case", { status: 404 });
  const rec = found.sale.dispute;
  let bytes: Uint8Array;
  if (rec?.filing?.pdfBase64) bytes = Buffer.from(rec.filing.pdfBase64, "base64");
  else {
    const facts = await gatherFacts(d, found.orderId, found.sale);
    bytes = await buildPdf(facts, rec?.draft?.notes ?? templateNotes(facts));
  }
  return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${pdfName(id)}"` } });
}
