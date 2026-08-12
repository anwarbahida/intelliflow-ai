/**
 * AI provider abstraction — swap providers here without touching feature code.
 * Server-only: never import from client components.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const AI_MODELS = {
  fast: "openai/gpt-5.6-luna",
  balanced: "openai/gpt-5.6-terra",
  deep: "openai/gpt-5.6-sol",
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
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError("Service IA non configuré.", 500);

  const model = AI_MODELS[options.tier ?? "balanced"];

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, messages, reasoning_effort: "none", stream: false }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new AiError("Trop de requêtes IA en peu de temps. Réessaie dans un instant.", 429);
    }
    if (response.status === 402) {
      throw new AiError("Le quota IA de la plateforme est épuisé. Contacte l'administrateur.", 402);
    }
    console.error(`AI gateway error [${response.status}]: ${body}`);
    throw new AiError("L'analyse IA a échoué. Réessaie.", response.status);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new AiError("L'IA n'a renvoyé aucun résultat.", 502);

  return { text, model, tokens: data.usage?.total_tokens ?? 0 };
}

/** Rough cost estimate in EUR, used for admin margin analytics. */
export function estimateCost(tokens: number): number {
  return Number(((tokens / 1_000_000) * 1.6).toFixed(6));
}
