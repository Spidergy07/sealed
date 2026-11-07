import { z } from "zod";
import { chat, parseJson } from "./llm";
import type { LabelRead } from "./label";

const Read = z.object({
  name: z.string().nullable().default(null),
  street1: z.string().nullable().default(null),
  street2: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  state: z.string().nullable().default(null),
  zip: z.string().nullable().default(null),
  carrier: z.enum(["USPS", "UPS", "FEDEX", "DHL", "OTHER"]).nullable().catch(null),
  tracking_number: z.string().nullable().default(null),
});

const PROMPT = `Read the SHIP TO block of this shipping label (the recipient, not the sender). Reply with JSON only:
{"name":string|null,"street1":string|null,"street2":string|null,"city":string|null,"state":string|null,"zip":string|null,
 "carrier":"USPS"|"UPS"|"FEDEX"|"DHL"|"OTHER"|null,"tracking_number":string|null}
tracking_number is the number printed under the main barcode, without spaces. Use null for anything you cannot read clearly. Do not guess.`;

export async function readLabel(dataUrl: string): Promise<{ read: LabelRead; provider: string; model: string }> {
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl) || dataUrl.length > 3_000_000) throw new Error("Send a PNG, JPEG or WebP photo under about 2 MB");
  const res = await chat([{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }], { json: true });
  const parsed = Read.safeParse(parseJson(res.text));
  if (!parsed.success) throw new Error(`Model ${res.provider}/${res.model} returned an unexpected shape`);
  return { read: parsed.data, provider: res.provider, model: res.model };
}
