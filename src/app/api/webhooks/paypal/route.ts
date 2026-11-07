import { verifyWebhook } from "@/lib/paypal";
import { put } from "@/lib/store";
import { observe, viewDispute } from "@/lib/disputes";

export async function POST(req: Request) {
  const event = await req.json().catch(() => null);
  if (!event?.id || !event?.event_type) return new Response("bad event", { status: 400 });
  const v = await verifyWebhook(req.headers, event);
  // Unverified events are kept for debugging but marked, and nothing downstream trusts them.
  await put("events", event.id, {
    id: event.id,
    type: event.event_type,
    verified: v.verified,
    verification: v.reason,
    resourceId: event.resource?.id ?? event.resource?.dispute_id,
    orderId: event.resource?.supplementary_data?.related_ids?.order_id,
    receivedAt: new Date().toISOString(),
    resource: event.resource,
  });
  // The webhook carries the dispute itself, so the case is on the sale's record before the list API shows it.
  if (v.verified && event.event_type.startsWith("CUSTOMER.DISPUTE.") && event.resource?.dispute_id) {
    await observe(viewDispute(event.resource), `webhook ${event.event_type}`).catch(e => console.error("dispute observe", e));
  }
  return new Response(null, { status: v.verified ? 200 : 202 });
}
