// Label checks with no AI: tracking-number check digits and label-vs-PayPal address comparison.
import type { Address } from "./rules.ts";

export type Carrier = "USPS" | "UPS" | "FEDEX" | "DHL" | "OTHER";
export type LabelRead = {
  name: string | null; street1: string | null; street2: string | null;
  city: string | null; state: string | null; zip: string | null;
  carrier: Carrier | null; tracking_number: string | null;
};

const digits = (s: string) => s.replace(/\D/g, "");

// USPS IMpb (20 or 22 digits): mod 10, weights 3,1 from the right, check digit last.
export function uspsValid(n: string) {
  if (!/^\d{20}$|^\d{22}$/.test(n) || /^\d{4}0+$/.test(n)) return false; // test labels print all zeros after the prefix
  const body = n.slice(0, -1).split("").reverse();
  const sum = body.reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(n.at(-1));
}

// UPS 1Z: 16 characters after "1Z", letters map to (code - 63) % 10, odd positions x1, even x2.
export function upsValid(n: string) {
  if (!/^1Z[0-9A-Z]{16}$/.test(n)) return false;
  const v = n.slice(2, -1).split("").map(c => (/\d/.test(c) ? Number(c) : (c.charCodeAt(0) - 63) % 10));
  const sum = v.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 2), 0);
  return (10 - (sum % 10)) % 10 === Number(n.at(-1));
}

// Normalises what a barcode or the model read into a tracking number we trust, or null.
// shortcut: FedEx/DHL numbers are accepted on format only, add their check digits if a real seller ships with them.
export function cleanTracking(raw: string | null | undefined, carrier?: Carrier | null): { number: string; carrier: Carrier } | null {
  if (!raw) return null;
  const up = raw.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (upsValid(up)) return { number: up, carrier: "UPS" };
  const d = digits(raw);
  // USPS barcodes carry "420" + ZIP in front of the tracking number, so try the trailing 22 and 20 digits.
  for (const len of [22, 20]) if (d.length >= len && uspsValid(d.slice(-len))) return { number: d.slice(-len), carrier: "USPS" };
  if (carrier === "FEDEX" && /^\d{12}$|^\d{15}$/.test(d)) return { number: d, carrier: "FEDEX" };
  if (carrier === "DHL" && /^\d{10}$/.test(d)) return { number: d, carrier: "DHL" };
  return null;
}

const zip5 = (s?: string | null) => s?.match(/\d{5}/)?.[0];
const streetNo = (s?: string | null) => s?.trim().match(/^\d+/)?.[0];
const words = (s?: string | null) =>
  new Set((s || "").toUpperCase().replace(/\b(STREET|ST|AVENUE|AVE|ROAD|RD|NORTH|N|SOUTH|S|EAST|E|WEST|W|SUITE|STE|APT|UNIT)\b/g, " ")
    .replace(/\b1ST\b/g, "FIRST").replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(w => w && !/^\d+$/.test(w)));

export type Compare = { match: boolean; diffs: string[] };

// The label must name the same ZIP, street number and street as the PayPal ship-to.
export function compareLabel(l: LabelRead, a: Address): Compare {
  const diffs: string[] = [];
  if (!l.zip || zip5(l.zip) !== zip5(a.postal_code)) diffs.push(`ZIP ${l.zip ?? "unreadable"} vs ${a.postal_code}`);
  if (streetNo(l.street1) !== streetNo(a.address_line_1)) diffs.push(`street number ${streetNo(l.street1) ?? "unreadable"} vs ${streetNo(a.address_line_1)}`);
  const lw = words(l.street1), aw = words(a.address_line_1);
  if (![...aw].some(w => lw.has(w))) diffs.push(`street "${l.street1 ?? "unreadable"}" vs "${a.address_line_1}"`);
  return { match: diffs.length === 0, diffs };
}
