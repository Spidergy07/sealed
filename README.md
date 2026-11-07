# Sealed

**Check the box before you tape it.**

Sealed is a packing-bench copilot for people who sell used gear (GPUs, cameras, music gear) and get paid with PayPal Goods and Services. Before the box is taped, the seller photographs the shipping label. Sealed compares it with the ship-to address on the PayPal transaction and stops the one mistake that makes a sale ineligible for Seller Protection: shipping somewhere the buyer asked for in chat instead of the Transaction Details address. Then it pushes tracking into the PayPal order, and if a case comes anyway, it turns the same record into evidence the seller approves before anything is filed.

- Live demo: https://sealed-silk.vercel.app (PayPal sandbox, EasyPost test mode, no real money or postage)
- Video (2:43): https://youtu.be/2rvWA1popC8
- Built for the PayPal AI Hackathon 2026

## Why

PayPal's US Seller Protection terms (updated January 26, 2026) say: "You must ship the item to the shipping address on the Transaction Details page in your PayPal account for the transaction." On marketplaces like r/hardwareswap the buyer often asks, in a DM, to ship to a work address or a friend. The seller does it to be nice, has tracking, and still loses the claim. Other tools check what PayPal's record says. Sealed checks the box.

## Try it in two minutes

1. **Packing bench, no phone needed.** Open the demo, pick a paid order (or create one, see step 3), tap **Open packing bench**, then **No box handy? Use a sample photo**.
   - *Box labeled to the buyer's new address*: the label is read (barcode plus USPS check digit), the ZIP does not match PayPal's ship-to, and you get **Stop. Don't tape this box.** with the exact clause. Tap **Reprint to the address PayPal has on file**, then **Add tracking to PayPal**. Sealed pushes the number with Orders v2 `/track` and reads it back from PayPal's tracker list.
   - *Box labeled to the PayPal address*: the label matches and you can go straight to tracking.
   - You can also upload your own photo with **Photograph the shipping label**.
2. **A real recorded case.** Open https://sealed-silk.vercel.app/disputes/PP-R-JPW-10197024 to see a case that went through the whole flow on production: the webhook that attached it to the sale, the evidence plan, the notes and PDF that were filed, and the chain of states PayPal returned, each with its debug_id. The filed PDF is at `/disputes/PP-R-JPW-10197024/evidence.pdf`.
3. **Full flow.** Create a sale on the home page, use **Use sample chat** to see the DM check, then pay the PayPal link with the sandbox buyer account (credentials are in the Devpost testing notes).

## What it does

| Step | What happens | PayPal surface |
|---|---|---|
| Sale | Creates a Goods and Services checkout with the serial as SKU and `shipping_preference: GET_FROM_FILE` | Orders v2 create |
| DM check | A free LLM extracts facts from the buyer chat (new address, Friends and Family request, buyer-arranged label, meet-up). A rule table, not the model, decides and quotes the clause | none (rules quote the 2026 terms) |
| Payment | Captures with a `PayPal-Request-Id`, shows the Transaction Details ship-to and PayPal's own `seller_protection` flag. Blocks packing unless the capture is COMPLETED | Orders v2 capture, Webhooks |
| Packing bench | Photo is hashed (SHA-256), the barcode is decoded in the browser, a vision model reads the address. Plain code compares ZIP, street number and street name with PayPal's ship-to | none |
| Fix | Reprints a label to the PayPal address (EasyPost test), or refunds and creates a new checkout, which is PayPal's own suggestion when the buyer insists on another address | Payments refund, Orders v2 create |
| Tracking | Pushes tracking to the capture and reads it back from PayPal to prove it is on the transaction | Orders v2 `/track`, `GET /v1/shipping/trackers` |
| Case | Verified `CUSTOMER.DISPUTE.*` webhooks attach the case to the sale (capture to order). The page reads what PayPal requests (`evidences[]` with `REQUESTED_FROM_SELLER`) and builds the evidence plan | Webhooks, Disputes get |
| Evidence | A free model words the reviewer notes (2,000 character limit). Code rejects notes that drop the tracking number or ZIP, claim a label check the record does not have, or claim delivery without a DELIVERED tracker. A one-page PDF is built from PayPal's records. Nothing is filed until the seller ticks the box and taps File | Disputes `provide-evidence` (INQUIRY) or `provide-supporting-info` (CHARGEBACK) |

## AI, and where it stops

All AI calls run on free tiers through one OpenAI-compatible client (`src/lib/llm.ts`):

1. OpenRouter free models only (the code refuses any model id without `:free`), default `nvidia/nemotron-3.5-super-vl:free`
2. Gemini Flash-Lite, then Flash, as fallback
3. Typhoon for text-only fallback

The model reads: buyer chats, label photos, and it words the dispute notes. It never decides coverage. Every block comes from a versioned rule table (`src/lib/rules.ts`) that quotes PayPal's terms verbatim with a source link and version date, and every address comparison is plain code (`src/lib/label.ts`).

## Sandbox findings

Everything below was observed in the PayPal sandbox and is logged with debug_ids in [`docs/sandbox-findings.md`](docs/sandbox-findings.md).

- Three Item Not Received cases that already had tracking moved from INQUIRY to CHARGEBACK within minutes; there only `provide_supporting_info` is offered. The one untracked case stayed in INQUIRY with PROOF_OF_FULFILLMENT requested.
- `provide-supporting-info` accepts multipart with an `input` JSON part (`{notes}`) and the file in a part named `supporting document`; the notes and a document URL show up in `supporting_info[]` right away (debug_id f10460246e606 on the production run).
- `CUSTOMER.DISPUTE.CREATED` arrived about 3 minutes after the buyer filed, while `GET /v1/customer/disputes` took up to 50 minutes to list new cases. Sealed builds the case record from the webhook payload.
- A capture can succeed while the very next `GET` of the order still says APPROVED with no captures. Sealed fills the view from the capture response when that happens.
- The sandbox accepted a tracking number on `/track` that fails the USPS check digit, so Sealed validates check digits itself before pushing.
- `verify-webhook-signature` returns HTTP 200 for bad signatures; the decision is made on `verification_status`.

## Honest limits

- Sandbox only. Live use would need each seller's PayPal account connected through Partner Referrals with tracking and dispute permissions.
- The `provide-evidence` path is implemented but has not been filed live, because the only INQUIRY case available had no tracking to send. The supporting-info path has been filed twice.
- Labels are EasyPost test labels. The sample photos are a generated test label composited onto a real box photo, marked "SANDBOX TEST LABEL, NO POSTAGE VALUE".
- The sender address for reprints is a fixed demo address.
- The barcode reader (zxing-js) misses barcodes when a dark frame shares the barcode rows. Then the model's reading of the printed digits is used, and only if it passes the carrier check digit.

## Run it

```bash
cp .env.example .env.local   # sandbox PayPal app, EasyPost test key, free LLM keys, optional Supabase
npm install
npm run dev
npm test                      # 18 tests, no network
```

Without Supabase variables the store falls back to a local JSON file. Code map: `src/lib/paypal.ts` (Orders, tracking, webhooks), `src/lib/disputes.ts`, `src/lib/evidence.ts` (facts, notes, PDF), `src/lib/rules.ts`, `src/lib/label.ts`, `src/lib/llm.ts`, `src/app/orders/[id]/pack/` (packing bench), `src/app/disputes/`.

## Credits

Box photo in the sample label shots: "Sealing a package with plastic tape for shipping" by Meanwell Packaging, CC BY 2.0, via Wikimedia Commons. Policy quotes: PayPal US Seller Protection (version January 26, 2026) and PayPal help article help177.

## License

MIT
