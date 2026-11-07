// EasyPost test mode: buys a VOID label to the address PayPal has on file. Test keys never charge.
import type { OrderView } from "./paypal";

const API = "https://api.easypost.com/v2";
// shortcut: one demo sender address, make it a per-seller setting before real use.
const FROM = { name: "Sealed Demo Seller", street1: "388 Townsend St", city: "San Francisco", state: "CA", zip: "94107", country: "US", phone: "4155550100" };
const PARCEL = { length: 14, width: 10, height: 6, weight: 96 }; // oz, a boxed GPU

async function ep(path: string, body: unknown) {
  const key = process.env.EASYPOST_API_KEY;
  if (!key?.startsWith("EZTK")) throw new Error("EASYPOST_API_KEY must be a test key (EZTK...)");
  const r = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${key}:`).toString("base64"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`EasyPost ${r.status}: ${j.error?.message ?? JSON.stringify(j).slice(0, 200)}`);
  return j;
}

export async function buyLabelToShipTo(shipTo: NonNullable<OrderView["shipTo"]>) {
  const s = await ep("/shipments", { shipment: {
    to_address: { name: shipTo.name, street1: shipTo.address_line_1, street2: shipTo.address_line_2, city: shipTo.admin_area_2, state: shipTo.admin_area_1, zip: shipTo.postal_code, country: shipTo.country_code ?? "US" },
    from_address: FROM,
    parcel: PARCEL,
  } });
  const rate = s.rates?.find((r: any) => r.carrier === "USPS" && r.service === "Priority") ?? s.rates?.find((r: any) => r.carrier === "USPS");
  if (!rate) throw new Error(`EasyPost returned no USPS rate: ${JSON.stringify(s.messages ?? []).slice(0, 200)}`);
  const b = await ep(`/shipments/${s.id}/buy`, { rate: { id: rate.id } });
  return {
    shipmentId: b.id as string,
    trackingCode: b.tracking_code as string,
    labelUrl: b.postage_label?.label_url as string,
    trackerUrl: b.tracker?.public_url as string | undefined,
    service: `${rate.carrier} ${rate.service}`,
    toZip: b.to_address?.zip as string,
  };
}
