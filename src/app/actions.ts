"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createOrder, syncOrder } from "@/lib/paypal";
import { put, get } from "@/lib/store";
import { extractDmFacts } from "@/lib/dm";
import { dmFlags, type DmFacts, type Flag } from "@/lib/rules";

async function origin() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function createSale(form: FormData) {
  const title = String(form.get("title") || "").trim();
  const price = String(form.get("price") || "");
  const serial = String(form.get("serial") || "").trim();
  if (!title || !(Number(price) >= 1 && Number(price) <= 10000)) throw new Error("Item name and a price between $1 and $10,000 are required");
  const o = await origin();
  const r = await createOrder({ title, price, serial }, `${o}/return`, `${o}/`);
  if (r.status >= 300) throw new Error(`PayPal ${r.status} debug_id ${r.debugId}: ${JSON.stringify(r.json).slice(0, 300)}`);
  await put("sales", r.json.id, { id: r.json.id, title, price: Number(price).toFixed(2), serial, createDebugId: r.debugId });
  redirect(`/orders/${r.json.id}`);
}

export type DmResult = { facts: DmFacts; flags: Flag[]; provider: string; model: string } | { error: string };

export async function checkDm(orderId: string, text: string): Promise<DmResult> {
  if (!text.trim()) return { error: "Paste the buyer chat first." };
  try {
    const [order, ex] = await Promise.all([syncOrder(orderId).catch(() => undefined), extractDmFacts(text)]);
    const flags = dmFlags(ex.facts, order?.shipTo);
    const sale = await get("sales", orderId);
    if (sale) await put("sales", orderId, { ...sale, dm: { facts: ex.facts, flags: flags.map(f => f.rule.id), by: `${ex.provider}/${ex.model}` } });
    return { ...ex, flags };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
