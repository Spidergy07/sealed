// PayPal US Seller Protection rules Sealed checks, quoted verbatim. Each row names its source and version date.
// Severity: "block" stops packing, "warn" is a PayPal recommendation, "info" is shown on the checklist.

const SP = { url: "https://www.paypal.com/us/legalhub/paypal/seller-protection", version: "2026-01-26" };
const HELP177 = {
  url: "https://www.paypal.com/us/cshelp/article/how-do-i-prove-that-ive-sent-an-item-or-digital-goods-to-the-buyer-help177",
  version: "fetched 2026-11-07",
};

export type Severity = "block" | "warn" | "info";
export type Rule = { id: string; title: string; severity: Severity; quote: string; url: string; version: string };

export const RULES: Rule[] = [
  { id: "ship_to_td", title: "Ship only to the Transaction Details address", severity: "block", ...SP,
    quote: "You must ship the item to the shipping address on the Transaction Details page in your PayPal account for the transaction. If you originally ship the item to the recipient's shipping address on the Transaction Details page but the item is later redirected to a different address, you will not be eligible for PayPal's Seller Protection program." },
  { id: "redirect_remedy", title: "Buyer wants another address: refund and re-bill", severity: "info", ...HELP177,
    quote: "If the buyer demands that you deliver to an address different from the one in the Transaction Details page, we suggest contacting the buyer to arrange a refund and make a new payment with the correct delivery address." },
  { id: "buyer_label", title: "Buyer-arranged shipping label", severity: "warn", ...SP,
    quote: "We therefore recommend not using a shipping service that is arranged by the buyer, so that you will be able to provide valid proof of shipping and delivery." },
  { id: "friends_family", title: "Friends and Family payment", severity: "block", ...SP,
    quote: "Personal payments including a payment sent using PayPal's friends and family functionality." },
  { id: "in_person", title: "In-person handoff", severity: "warn", ...SP,
    quote: "Physical, tangible items delivered in person, including in connection with a payment made in your physical store, unless the buyer paid for the transaction in person using PayPal's goods and services QR code." },
  { id: "hold", title: "Payment not completed", severity: "block", ...SP,
    quote: "Items sent after PayPal advised you not to release the item." },
  { id: "ship_7_days", title: "Ship within 7 days", severity: "info", ...SP,
    quote: "Otherwise, it is recommended that you ship all items within 7 days after receipt of payment." },
  { id: "proof", title: "Proof of shipment", severity: "info", ...SP,
    quote: "An online and verifiable tracking number. Date of shipment. An address for the recipient that matches the shipping address on the Transaction Details page." },
  { id: "us_primary", title: "US primary address", severity: "info", ...SP,
    quote: "The primary address for your PayPal account must be in the United States." },
];

export const rule = (id: string) => {
  const r = RULES.find(r => r.id === id);
  if (!r) throw new Error(`unknown rule ${id}`);
  return r;
};

// What the AI extracts from the buyer's messages. Booleans only mean "the messages say so".
export type DmFacts = {
  asks_friends_family: boolean;
  buyer_arranged_label: boolean;
  wants_in_person: boolean;
  requested_address: string | null; // an address the buyer asks to ship to, if any
  quotes: string[]; // the buyer's own words behind each fact
};

export type Flag = { rule: Rule; detail: string };

export type Address = { address_line_1?: string; admin_area_2?: string; admin_area_1?: string; postal_code?: string };

const zip5 = (s?: string) => s?.match(/\b\d{5}\b/)?.[0];
const norm = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// True when a free-text address names the same ZIP and street number as the PayPal ship-to.
export function sameAddress(text: string, shipTo: Address) {
  const z = zip5(text);
  const num = shipTo.address_line_1?.match(/^\d+/)?.[0];
  return !!z && z === zip5(shipTo.postal_code) && (!num || norm(text).includes(num));
}

export function dmFlags(f: DmFacts, shipTo?: Address): Flag[] {
  const out: Flag[] = [];
  if (f.asks_friends_family) out.push({ rule: rule("friends_family"), detail: "Buyer asked to pay or refund through Friends and Family." });
  if (f.requested_address && !(shipTo && sameAddress(f.requested_address, shipTo))) {
    out.push({ rule: rule("ship_to_td"), detail: `Buyer asked to ship to "${f.requested_address}", which is not the address PayPal has on file.` });
    out.push({ rule: rule("redirect_remedy"), detail: "PayPal's suggested fix if the buyer insists." });
  }
  if (f.buyer_arranged_label) out.push({ rule: rule("buyer_label"), detail: "Buyer offered to send their own shipping label." });
  if (f.wants_in_person) out.push({ rule: rule("in_person"), detail: "Buyer wants to meet in person." });
  return out;
}

// Checks that come from the PayPal order itself, no AI involved.
export function orderFlags(o: { captureStatus?: string; captureReason?: string; capturedAt?: string }, now = Date.now()): Flag[] {
  const out: Flag[] = [];
  if (o.captureStatus !== "COMPLETED") out.push({ rule: rule("hold"), detail: `Capture status is ${o.captureStatus ?? "missing"}${o.captureReason ? ` (${o.captureReason})` : ""}. Do not pack until it is COMPLETED.` });
  if (o.capturedAt) {
    const days = (now - Date.parse(o.capturedAt)) / 864e5;
    out.push({ rule: rule("ship_7_days"), detail: days > 7 ? `Paid ${Math.floor(days)} days ago, past the recommended 7 days.` : `${Math.max(0, 7 - Math.floor(days))} days left in the recommended window.` });
  }
  return out;
}
