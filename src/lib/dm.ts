import { z } from "zod";
import { chat, parseJson } from "./llm";
import type { DmFacts } from "./rules";

const Facts = z.object({
  asks_friends_family: z.boolean(),
  buyer_arranged_label: z.boolean(),
  wants_in_person: z.boolean(),
  requested_address: z.string().nullable(),
  quotes: z.array(z.string()).default([]),
});

const SYSTEM = `You read a chat between a seller and a buyer of a used item paid with PayPal Goods & Services.
Extract only what the BUYER says. Reply with JSON only:
{"asks_friends_family": bool,   // buyer asks to pay, or be refunded, via Friends and Family / F&F / personal payment
 "buyer_arranged_label": bool,  // buyer offers to send their own shipping label or use their own carrier account
 "wants_in_person": bool,       // buyer wants to meet up or pick up in person
 "requested_address": string|null, // a full shipping address the buyer asks the seller to ship to, copied exactly; null if none
 "quotes": [string]}            // the buyer's exact sentences behind each true fact or address
Do not guess. If the chat does not say it, the value is false or null.`;

export async function extractDmFacts(chatText: string): Promise<{ facts: DmFacts; provider: string; model: string }> {
  const res = await chat(
    [{ role: "system", content: SYSTEM }, { role: "user", content: chatText.slice(0, 8000) }],
    { json: true },
  );
  const parsed = Facts.safeParse(parseJson(res.text));
  if (!parsed.success) throw new Error(`Model ${res.provider}/${res.model} returned an unexpected shape`);
  return { facts: parsed.data, provider: res.provider, model: res.model };
}

export const SAMPLE_DM = `buyer_jordan: hey is the 4080 still available? $780 works
seller: yes, still have it. PayPal G&S to my email and I ship USPS priority
buyer_jordan: cool, sending G&S now
buyer_jordan: oh one thing, i'm moving this week. can you ship to my work instead? 455 Market St, Suite 300, San Francisco CA 94105
buyer_jordan: i can also send you a prepaid label from my UPS account if that's easier`;
