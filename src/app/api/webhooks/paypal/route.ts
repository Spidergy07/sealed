import { verifyWebhook } from "@/lib/paypal";
import { put } from "@/lib/store";

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
    resourceId: event.resource?.id,
    orderId: event.resource?.supplementary_data?.related_ids?.order_id,
    receivedAt: new Date().toISOString(),
    resource: event.resource,
  });
  return new Response(null, { status: v.verified ? 200 : 202 });
}
