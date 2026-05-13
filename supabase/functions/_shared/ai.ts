// AI provider abstraction: Anthropic (primary) or OpenAI (fallback).
// To switch providers, set/remove secrets in Supabase Dashboard → Edge Functions → Secrets:
//   ANTHROPIC_API_KEY → uses Claude Haiku
//   OPENAI_API_KEY    → uses GPT-4o-mini (used when ANTHROPIC_API_KEY is absent)

export class AIError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AIError";
  }
}

interface AICallParams {
  system: string;
  user: string;
  maxTokens?: number;
}

export async function callAI({ system, user, maxTokens = 512 }: AICallParams): Promise<string> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (!anthropicKey && !openaiKey) {
    throw new Error("Nenhuma chave de API configurada (ANTHROPIC_API_KEY ou OPENAI_API_KEY)");
  }

  if (anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new AIError(`Anthropic API error: ${res.status}`, res.status);
    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error("Sem resposta da IA (Anthropic)");
    return text;
  }

  // OpenAI fallback
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new AIError(`OpenAI API error: ${res.status}`, res.status);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Sem resposta da IA (OpenAI)");
  return text;
}
