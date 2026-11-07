import { test } from "node:test";
import assert from "node:assert/strict";
import { uspsValid, upsValid, cleanTracking, compareLabel, type LabelRead } from "../src/lib/label.ts";

test("check digits on real sandbox tracking numbers", () => {
  assert.equal(uspsValid("9400111899223197428490"), false); // the made-up number from Day-0, PayPal sandbox accepted it anyway
  assert.equal(uspsValid("9405500208192110884478"), true);
  assert.equal(uspsValid("9405500208192110884461"), true); // EasyPost test label
  assert.equal(uspsValid("9405500208192110884462"), false); // one digit off
  assert.equal(uspsValid("9405000000000000000000"), false); // VOID test label prints zeros
  assert.equal(upsValid("1Z999AA10123456784"), true);
  assert.equal(upsValid("1Z999AA10123456785"), false);
});

test("cleanTracking strips the 420+ZIP barcode prefix and spaces", () => {
  assert.deepEqual(cleanTracking("420951319405500208192110884461"), { number: "9405500208192110884461", carrier: "USPS" });
  assert.deepEqual(cleanTracking("9405 5002 0819 2110 8844 61"), { number: "9405500208192110884461", carrier: "USPS" });
  assert.deepEqual(cleanTracking("1z 999 aa1 0123456784"), { number: "1Z999AA10123456784", carrier: "UPS" });
  assert.equal(cleanTracking("9405000000000000000000"), null);
});

const shipTo = { address_line_1: "2211 N First St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131" };
const read = (street1: string, zip: string): LabelRead => ({ name: "JORDAN BUYER", street1, street2: null, city: null, state: "CA", zip, carrier: "USPS", tracking_number: null });

test("label to the PayPal address matches despite 1ST vs First and ZIP+4", () => {
  assert.deepEqual(compareLabel(read("2211 N 1ST ST", "95131-2021"), shipTo), { match: true, diffs: [] });
});

test("label to the buyer's redirect address is a mismatch on every field", () => {
  const c = compareLabel(read("455 MARKET ST STE 300", "94105-2421"), shipTo);
  assert.equal(c.match, false);
  assert.equal(c.diffs.length, 3);
});

test("right street, wrong ZIP is still a mismatch", () => {
  assert.equal(compareLabel(read("2211 N 1ST ST", "95134"), shipTo).match, false);
});
