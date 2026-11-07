// One chat call, tried across free providers in order: OpenRouter free models, then Gemini, then Typhoon.
// All three speak the OpenAI chat-completions format, so no SDKs.

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type Msg = { role: "system" | "user" | "assistant"; content: string | Part[] };
export type LlmResult = { text: string; provider: string; model: string; tried: string[] };

type Provider = { name: string; url: string; key?: string; models: string[]; vision: boolean };

const list = (v: string | undefined, d: string) => (v || d).split(",").map(s => s.trim()).filter(Boolean);

export function providers(env: Record<string, string | undefined> = process.env): Provider[] {
  return [
    {
      name: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: env.OPENROUTER_API_KEY,
      // Only ":free" ids are allowed so a paid OpenRouter key can never be charged.
      models: list(env.OPENROUTER_MODELS, "nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free").filter(m => m.endsWith(":free")),
      vision: true,
    },
    {
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: env.GEMINI_API_KEY,
      models: list(env.GEMINI_MODELS, "gemini-flash-latest"),
      vision: true,
    },
    {
      name: "typhoon",
      url: "https://api.opentyphoon.ai/v1/chat/completions",
      key: env.TYPHOON_API_KEY,
      models: list(env.TYPHOON_MODELS, "typhoon-v2.5-30b-a3b-instruct"),
      vision: env.TYPHOON_VISION === "1",
    },
  ];
}

// Models that just returned 429/402 are skipped for a minute so a run does not wait on each of them again.
const cooldown = new Map<string, number>();

export async function chat(
  messages: Msg[],
  opts: { json?: boolean; timeoutMs?: number; env?: Record<string, string | undefined> } = {},
): Promise<LlmResult> {
  const needsVision = messages.some(m => Array.isArray(m.content) && m.content.some(p => p.type === "image_url"));
  const tried: string[] = [];
  for (const p of providers(opts.env)) {
    if (!p.key || (needsVision && !p.vision)) continue;
    for (const model of p.models) {
      const id = `${p.name}/${model}`;
      if ((cooldown.get(id) ?? 0) > Date.now()) continue;
      tried.push(id);
      try {
        const r = await fetch(p.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, temperature: 0, ...(opts.json ? { response_format: { type: "json_object" } } : {}) }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
        });
        if (r.status === 429 || r.status === 402) cooldown.set(id, Date.now() + 60_000);
        if (!r.ok) continue;
        const j = await r.json();
        const text: string | undefined = j.choices?.[0]?.message?.content;
        if (!text) continue;
        if (opts.json && parseJson(text) === undefined) continue;
        return { text, provider: p.name, model, tried };
      } catch {
        // timeout or network error: next model
      }
    }
  }
  throw new Error(`All free LLM providers failed or are not configured (tried: ${tried.join(", ") || "none"})`);
}

// Models sometimes wrap JSON in ``` fences or add a sentence around it.
export function parseJson(text: string): unknown {
  const s = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  for (const c of [s, s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)]) {
    try { return JSON.parse(c); } catch {}
  }
  return undefined;
}
