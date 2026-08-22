/**
 * AI provider abstraction — Groq (free tier, OpenAI-compatible).
 * Server-only: never import from client components.
 *
 * Get a free API key at https://console.groq.com
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const AI_MODELS = {
  fast: "openai/gpt-oss-20b",
  balanced: "openai/gpt-oss-120b",
  deep: "openai/gpt-oss-120b",
} as const;

export type ModelTier = keyof typeof AI_MODELS;

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiResult = {
  text: string;
  model: string;
  tokens: number;
};

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function runAi(
  messages: AiMessage[],
  options: { tier?: ModelTier } = {},
): Promise<AiResult> {
  const key = process.env["GROQ_API_KEY"];
  if (!key) throw new AiError("Service IA non configuré. Clé GROQ_API_KEY manquante.", 500);

  const model = AI_MODELS[options.tier ?? "balanced"];

  let lastError: AiError | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) throw new AiError("L'IA n'a renvoyé aucun résultat.", 502);
      return { text, model, tokens: data.usage?.total_tokens ?? 0 };
    }

    const body = await response.text();
    if (response.status === 429) {
      lastError = new AiError("Trop de requêtes IA. Réessaie dans un instant.", 429);
      continue;
    }
    if (response.status === 402) {
      throw new AiError("Le quota IA est épuisé. Contacte l'administrateur.", 402);
    }
    console.error(`AI gateway error [${response.status}]: ${body}`);
    throw new AiError("L'analyse IA a échoué. Réessaie.", response.status);
  }

  throw lastError ?? new AiError("L'analyse IA a échoué. Réessaie.", 500);
}

/** Rough cost estimate in EUR — Groq is free so this is $0. */
export function estimateCost(tokens: number): number {
  return 0;
}
