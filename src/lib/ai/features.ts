/** Client-safe catalog of AI features. Adding a feature = adding an entry here. */

export type AiFeatureKey =
  | "summary"
  | "extract"
  | "qa"
  | "risk"
  | "report"
  | "actions"
  | "finance"
  | "compare"
  | "assistant"
  | "search";

export type AiFeature = {
  key: AiFeatureKey;
  label: string;
  description: string;
  credits: number;
  tier: "fast" | "balanced" | "deep";
  premium: boolean;
  system: string;
};

export const AI_FEATURES: Record<AiFeatureKey, AiFeature> = {
  summary: {
    key: "summary",
    label: "Résumé intelligent",
    description: "Synthèse structurée en quelques secondes, prête à partager.",
    credits: 2,
    tier: "fast",
    premium: false,
    system:
      "Tu es un analyste documentaire. Produis un résumé structuré en markdown : contexte, points clés (liste), chiffres importants, conclusion. Sois factuel, jamais inventif.",
  },
  extract: {
    key: "extract",
    label: "Extraction de données",
    description: "Dates, montants, parties, obligations : structurés automatiquement.",
    credits: 3,
    tier: "balanced",
    premium: false,
    system:
      "Tu es un moteur d'extraction. Extrais les données clés du document en markdown avec un tableau (Champ | Valeur | Où dans le document). N'invente aucune donnée absente.",
  },
  qa: {
    key: "qa",
    label: "Questions / Réponses",
    description: "Interroge n'importe quel document en langage naturel.",
    credits: 1,
    tier: "fast",
    premium: false,
    system:
      "Réponds à la question uniquement à partir du document fourni, en citant les passages utiles entre guillemets. Si l'information est absente, dis-le clairement.",
  },
  risk: {
    key: "risk",
    label: "Analyse de risques",
    description: "Clauses sensibles détectées, notées et reformulées.",
    credits: 8,
    tier: "deep",
    premium: true,
    system:
      "Tu es juriste d'affaires. Analyse le document et rends un tableau markdown : Clause | Risque (Faible/Moyen/Élevé) | Pourquoi | Reformulation proposée. Termine par les 3 priorités de négociation.",
  },
  report: {
    key: "report",
    label: "Génération de rapport",
    description: "Un rapport client complet, structuré et livrable.",
    credits: 10,
    tier: "deep",
    premium: true,
    system:
      "Tu es consultant senior. Rédige un rapport professionnel en markdown : synthèse exécutive, analyse détaillée, tableau de données, risques, recommandations, prochaines étapes.",
  },
  actions: {
    key: "actions",
    label: "Plan d'action",
    description: "Transforme un document en tâches concrètes et priorisées.",
    credits: 3,
    tier: "balanced",
    premium: false,
    system:
      "Transforme le document en plan d'action markdown : tableau Priorité | Action | Responsable suggéré | Échéance | Critère de réussite.",
  },
  finance: {
    key: "finance",
    label: "Analyse financière",
    description: "Indicateurs, tendances et anomalies expliqués simplement.",
    credits: 8,
    tier: "deep",
    premium: true,
    system:
      "Tu es analyste financier. Analyse les données du document : indicateurs clés, tendances, anomalies, risques, recommandations chiffrées. Markdown avec tableaux.",
  },
  compare: {
    key: "compare",
    label: "Comparaison",
    description: "Détecte les écarts entre deux versions d'un document.",
    credits: 6,
    tier: "balanced",
    premium: true,
    system:
      "Compare les contenus fournis. Rends un tableau markdown : Élément | Version A | Version B | Impact. Termine par les écarts critiques.",
  },
  assistant: {
    key: "assistant",
    label: "Assistant IA",
    description: "Un copilote qui connaît tes documents et ton contexte.",
    credits: 1,
    tier: "balanced",
    premium: false,
    system:
      "Tu es Lexia, copilote d'analyse documentaire. Réponses concises, actionnables, en français, en markdown léger. Propose toujours une prochaine étape utile.",
  },
  search: {
    key: "search",
    label: "Recherche intelligente",
    description: "Retrouve la bonne information dans tous tes documents.",
    credits: 2,
    tier: "fast",
    premium: false,
    system:
      "Tu es un moteur de recherche sémantique. À partir des extraits de documents fournis, indique quels documents répondent à la requête, avec un extrait justificatif et un score de pertinence sur 10.",
  },
};

export const AI_FEATURE_LIST = Object.values(AI_FEATURES);

export function featureCredits(key: string): number {
  return AI_FEATURES[key as AiFeatureKey]?.credits ?? 2;
}

export function featureLabel(key: string): string {
  return AI_FEATURES[key as AiFeatureKey]?.label ?? key;
}
