import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseInput } from "@/lib/utils";

const analyzeSchema = z.object({
  documentId: z.string().uuid(),
  feature: z.enum(["summary", "extract", "qa", "risk", "report", "actions", "finance"]),
  question: z.string().max(1000).optional(),
});

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(analyzeSchema, input))
  .handler(async ({ data, context }) => {
    const { runFeature } = await import("@/lib/ai/engine.server");
    const { AI_FEATURES } = await import("@/lib/ai/features");

    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("id, title, content")
      .eq("id", data.documentId)
      .maybeSingle();
    if (error || !doc) throw new Error("Document introuvable.");

    const result = await runFeature({
      userId: context.userId,
      feature: data.feature,
      content: `Titre : ${doc.title}\n\n${doc.content}`,
      question: data.question,
    });

    const { data: analysis } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        document_id: doc.id,
        kind: data.feature,
        title: `${AI_FEATURES[data.feature].label} — ${doc.title}`,
        prompt: data.question ?? null,
        result: result.text,
        model: result.model,
        credits_cost: result.credits,
      })
      .select("id")
      .maybeSingle();

    if (data.feature === "summary") {
      await context.supabase
        .from("documents")
        .update({ summary: result.text.slice(0, 2000) })
        .eq("id", doc.id);
    }

    return { ...result, analysisId: analysis?.id ?? null };
  });

const chatSchema = z.object({
  message: z.string().min(1).max(50000),
  documentId: z.string().uuid().nullable().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(50000) }))
    .max(20)
    .optional(),
});

export const chatAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(chatSchema, input))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit, getProfile, chargeCredits } = await import("@/lib/ai/engine.server");
    const { runAi } = await import("@/lib/ai/provider.server");
    const { AI_FEATURES } = await import("@/lib/ai/features");

    await enforceRateLimit(context.userId);
    const profile = await getProfile(context.userId);
    const cost = AI_FEATURES.assistant.credits;
    if (profile.credits < cost) throw new Error("Crédits insuffisants pour l'assistant.");

    let docContext = "";
    if (data.documentId) {
      const { data: doc } = await context.supabase
        .from("documents")
        .select("title, content")
        .eq("id", data.documentId)
        .maybeSingle();
      if (doc) docContext = `Document actif « ${doc.title} » :\n${doc.content.slice(0, 12000)}`;
    } else {
      const { data: docs } = await context.supabase
        .from("documents")
        .select("title, summary")
        .order("created_at", { ascending: false })
        .limit(5);
      if (docs?.length) {
        docContext = `Documents récents de l'utilisateur :\n${docs
          .map((d) => `- ${d.title}${d.summary ? ` : ${d.summary.slice(0, 200)}` : ""}`)
          .join("\n")}`;
      }
    }

    const systemPrompt = [
      AI_FEATURES.assistant.system,
      `Utilisateur : ${profile.full_name ?? "client"} (plan ${profile.plan}).`,
      docContext.slice(0, 6000),
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await runAi(
      [
        { role: "system", content: systemPrompt },
        ...(data.history ?? []).map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user" as const, content: data.message },
      ],
      { tier: AI_FEATURES.assistant.tier },
    );

    await chargeCredits({
      userId: context.userId,
      feature: "assistant",
      credits: cost,
      model: result.model,
      tokens: result.tokens,
    });

    await context.supabase.from("analyses").insert({
      user_id: context.userId,
      document_id: data.documentId ?? null,
      kind: "assistant",
      title: data.message.slice(0, 80),
      prompt: data.message,
      result: result.text,
      model: result.model,
      credits_cost: cost,
    });

    return { text: result.text, credits: cost };
  });

const searchSchema = z.object({ query: z.string().min(2).max(400) });

export const smartSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(searchSchema, input))
  .handler(async ({ data, context }) => {
    const { runFeature } = await import("@/lib/ai/engine.server");
    const { data: docs } = await context.supabase
      .from("documents")
      .select("title, content")
      .order("created_at", { ascending: false })
      .limit(15);

    if (!docs?.length) return { text: "Aucun document à explorer pour le moment.", credits: 0 };

    const corpus = docs
      .map((d, i) => `### Document ${i + 1} — ${d.title}\n${d.content.slice(0, 1500)}`)
      .join("\n\n");

    return runFeature({
      userId: context.userId,
      feature: "search",
      content: corpus,
      question: data.query,
    });
  });

const demoSchema = z.object({ text: z.string().min(40).max(4000) });

export const runPublicDemo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => parseInput(demoSchema, input))
  .handler(async ({ data }) => {
    const { runAi } = await import("@/lib/ai/provider.server");
    const result = await runAi(
      [
        {
          role: "system",
          content:
            "Tu es Lexia, moteur d'analyse documentaire. Analyse l'extrait fourni et rends en markdown court : 3 points clés, les données chiffrées détectées, 1 risque, 1 action recommandée. Maximum 200 mots. Réponds dans la même langue que le texte fourni.",
        },
        { role: "user", content: data.text },
      ],
      { tier: "fast" },
    );
    return { text: result.text };
  });
