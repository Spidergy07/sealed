"use server";
import { headers } from "next/headers";
import { addTracking, createOrder, refundCapture, syncOrder } from "@/lib/paypal";
import { buyLabelToShipTo } from "@/lib/easypost";
import { readLabel } from "@/lib/vision";
import { cleanTracking, compareLabel, type Carrier, type Compare, type LabelRead } from "@/lib/label";
import { orderFlags, rule, type Flag } from "@/lib/rules";
import { get, put } from "@/lib/store";

async function save(orderId: string, patch: Record<string, unknown>) {
  const sale = (await get("sales", orderId)) ?? { id: orderId };
  await put("sales", orderId, { ...sale, pack: { ...sale.pack, ...patch } });
}

const fail = (e: unknown) => ({ error: (e as Error).message });

export type LabelResult =
  | { read: LabelRead; compare: Compare; flags: Flag[]; tracking: { number: string; carrier: Carrier } | null; trackingFrom?: "barcode" | "photo text"; by: string; amount?: string }
  | { error: string };

export async function checkLabel(orderId: string, dataUrl: string, photoSha256: string, barcodeText: string | null): Promise<LabelResult> {
  try {
    const order = await syncOrder(orderId);
    if (!order.captureId || !order.shipTo) return { error: "This order has no capture or no ship-to address yet." };
    const hold = orderFlags(order).filter(f => f.rule.severity === "block");
    if (hold.length) return { read: emptyRead, compare: { match: false, diffs: [] }, flags: hold, tracking: null, by: "PayPal capture status", amount: order.amount };

    const { read, provider, model } = await readLabel(dataUrl);
    // A decoded barcode beats the model's reading; either one must pass the carrier's check digit.
    const fromBarcode = cleanTracking(barcodeText, read.carrier);
    const tracking = fromBarcode ?? cleanTracking(read.tracking_number, read.carrier);
    const trackingFrom = tracking ? (fromBarcode ? "barcode" : "photo text") : undefined;
    const compare = compareLabel(read, order.shipTo);
    const flags: Flag[] = compare.match ? [] : [
      { rule: rule("ship_to_td"), detail: `This label does not match the PayPal ship-to: ${compare.diffs.join("; ")}.` },
      { rule: rule("redirect_remedy"), detail: "If the buyer insists on the new address, this is PayPal's suggested fix." },
    ];
    await save(orderId, { photoSha256, readAt: new Date().toISOString(), read, compare, tracking, trackingFrom, barcodeText, by: `${provider}/${model}` });
    return { read, compare, flags, tracking, trackingFrom, by: `${provider}/${model}`, amount: order.amount };
  } catch (e) {
    return fail(e);
  }
}

const emptyRead: LabelRead = { name: null, street1: null, street2: null, city: null, state: null, zip: null, carrier: null, tracking_number: null };

export type ReprintResult = Awaited<ReturnType<typeof buyLabelToShipTo>> | { error: string };

export async function reprintToPayPalAddress(orderId: string): Promise<ReprintResult> {
  try {
    const order = await syncOrder(orderId);
    if (!order.shipTo) return { error: "No PayPal ship-to address on this order." };
    const label = await buyLabelToShipTo(order.shipTo);
    await save(orderId, { reprint: { ...label, at: new Date().toISOString() } });
    return label;
  } catch (e) {
    return fail(e);
  }
}

export type TrackResult = Awaited<ReturnType<typeof addTracking>> | { error: string };

export async function pushTracking(orderId: string, number: string, carrier: Carrier): Promise<TrackResult> {
  try {
    const t = cleanTracking(number, carrier);
    if (!t) return { error: "That tracking number fails the carrier's check digit. Check it against the label." };
    const order = await syncOrder(orderId);
    if (!order.captureId) return { error: "Order has no capture yet." };
    const res = await addTracking(order.id, order.captureId, t.number, t.carrier);
    await save(orderId, { trackingPush: { ...res, number: t.number, carrier: t.carrier, at: new Date().toISOString() } });
    return res;
  } catch (e) {
    return fail(e);
  }
}

export type RebillResult = { refundId: string; refundStatus: string; refundDebugId: string | null; newOrderId: string; approveUrl?: string } | { error: string };

// PayPal's own fix when the buyer insists on another address: refund, then a new checkout they pay with that address on file.
export async function refundAndRebill(orderId: string): Promise<RebillResult> {
  try {
    const order = await syncOrder(orderId);
    if (!order.captureId || order.captureStatus !== "COMPLETED") return { error: "Only a COMPLETED capture can be refunded here." };
    const sale = (await get("sales", orderId)) ?? { id: orderId };
    const refund = await refundCapture(order.captureId);
    if (refund.status >= 300) return { error: `Refund failed, PayPal ${refund.status} debug_id ${refund.debugId}: ${JSON.stringify(refund.json).slice(0, 200)}` };
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const item = { title: order.title ?? sale.title ?? "Item", price: order.amount ?? sale.price, serial: sale.serial ?? "" };
    const next = await createOrder(item, `${origin}/return`, `${origin}/`);
    if (next.status >= 300) return { error: `Refunded (${refund.json.id}), but the new checkout failed: debug_id ${next.debugId}` };
    await put("sales", next.json.id, { id: next.json.id, title: item.title, price: item.price, serial: item.serial, rebillOf: orderId, createDebugId: next.debugId });
    await save(orderId, { rebill: { refundId: refund.json.id, refundStatus: refund.json.status, newOrderId: next.json.id, at: new Date().toISOString() } });
    return {
      refundId: refund.json.id, refundStatus: refund.json.status, refundDebugId: refund.debugId, newOrderId: next.json.id,
      approveUrl: next.json.links?.find((l: any) => l.rel === "payer-action")?.href,
    };
  } catch (e) {
    return fail(e);
  }
}
