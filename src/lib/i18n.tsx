import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LOCALES = ["fr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const RTL_LOCALES: readonly Locale[] = ["ar"];

const fr = {
  langName: "Français",
  nav: {
    dashboard: "Tableau de bord",
    documents: "Documents",
    assistant: "Assistant",
    features: "Fonctionnalités",
    useCases: "Cas d'usage",
    demo: "Démo IA",
    pricing: "Tarifs",
    faq: "FAQ",
    mySpace: "Mon espace",
    signIn: "Connexion",
    startFree: "Commencer gratuitement",
    menu: "Menu",
    logout: "Déconnexion",
    theme: "Changer de thème",
    language: "Changer de langue",
    admin: "Admin",
  },
  common: {
    loading: "Chargement…",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    back: "Retour",
    retry: "Réessayer",
    home: "Accueil",
    search: "Rechercher",
    close: "Fermer",
  },
  credits: {
    remaining: "{credits} crédits",
    short: "{credits} cr.",
  },
  features: {
    summary: {
      label: "Résumé intelligent",
      description: "Synthèse structurée en quelques secondes, prête à partager.",
    },
    extract: {
      label: "Extraction de données",
      description: "Dates, montants, parties, obligations : structurés automatiquement.",
    },
    qa: {
      label: "Questions / Réponses",
      description: "Interroge n'importe quel document en langage naturel.",
    },
    risk: {
      label: "Analyse de risques",
      description: "Clauses sensibles détectées, notées et reformulées.",
    },
    report: {
      label: "Génération de rapport",
      description: "Un rapport client complet, structuré et livrable.",
    },
    actions: {
      label: "Plan d'action",
      description: "Transforme un document en tâches concrètes et priorisées.",
    },
    finance: {
      label: "Analyse financière",
      description: "Indicateurs, tendances et anomalies expliqués simplement.",
    },
    compare: {
      label: "Comparaison",
      description: "Détecte les écarts entre deux versions d'un document.",
    },
    assistant: {
      label: "Assistant IA",
      description: "Un copilote qui connaît tes documents et ton contexte.",
    },
    search: {
      label: "Recherche intelligente",
      description: "Retrouve la bonne information dans tous tes documents.",
    },
  },
  site: {
    tagline: "L'intelligence documentaire qui transforme chaque dossier en décision.",
    product: "Produit",
    company: "Entreprise",
    start: "Commencer",
    pricing: "Tarifs",
    faq: "FAQ",
    signIn: "Connexion",
    createAccount: "Créer mon compte",
    createAccountFree: "Créer mon compte gratuit",
    creditsOffer: "50 crédits IA offerts, sans carte bancaire.",
    rights: "Tous droits réservés.",
  },
  meta: {
    homeTitle: "Lexia — L'IA qui analyse vos documents en secondes",
    homeDescription:
      "Contrats, rapports, factures : Lexia résume, extrait les données clés, détecte les risques et génère des rapports professionnels grâce à l'IA.",
    pricingTitle: "Tarifs — Lexia, analyse documentaire IA",
    pricingDescription:
      "Plans Free, Pro, Business et Enterprise : crédits IA inclus, facturation mensuelle ou annuelle, sans engagement.",
    authTitle: "Connexion — Lexia",
    authDescription:
      "Connectez-vous à Lexia pour analyser vos documents avec l'IA et suivre vos crédits.",
    dashboardTitle: "Tableau de bord — Lexia",
    dashboardDescription:
      "Suivez vos crédits IA, vos documents analysés et lancez de nouvelles analyses depuis votre espace Lexia.",
    documentsTitle: "Mes documents — Lexia",
    documentsDescription:
      "Importez vos contrats et rapports puis lancez des analyses IA : résumé, extraction, risques et plan d'action.",
    documentDetailTitle: "Analyse de document — Lexia",
    documentDetailDescription:
      "Lancez résumé, extraction de données, analyse de risques ou rapport complet sur votre document avec l'IA Lexia.",
    assistantTitle: "Assistant IA — Lexia",
    assistantDescription:
      "Discutez avec le copilote Lexia : il connaît vos documents et répond avec des recommandations actionnables.",
  },
  landing: {
    heroBadge: "Analyse documentaire augmentée par l'IA",
    heroTitle1: "Vos documents, lus et compris",
    heroTitleHighlight: "en 30 secondes",
    heroSubtitle:
      "Lexia transforme contrats, rapports et dossiers en résumés fiables, données structurées, risques identifiés et rapports prêts à envoyer.",
    heroCta1: "Commencer gratuitement",
    heroCta2: "Voir les tarifs",
    heroFreeNote: "50 crédits IA offerts · sans carte bancaire · données chiffrées",
    demoSummary: "Synthèse IA",
    demoRisks: "Risques détectés",
    demoLines: [
      "Contrat de prestation, 24 mois, renouvellement tacite.",
      "Pénalité de retard : 1,5 % par semaine entamée.",
      "Clause de résiliation asymétrique en faveur du client.",
    ],
    demoRiskLabels: [
      "Résiliation unilatérale",
      "Indexation tarifaire absente",
      "Confidentialité limitée",
    ],
    riskHigh: "Élevé",
    riskMedium: "Moyen",
    riskLow: "Faible",
    featuresTitle: "Une suite d'analyses IA, facturée au crédit",
    featuresSubtitle:
      "Chaque analyse a un coût transparent. Vous ne payez que ce que vous utilisez.",
    howTitle: "Trois étapes, zéro friction",
    steps: [
      {
        title: "Déposez votre document",
        text: "Collez ou importez un contrat, un rapport, un compte-rendu.",
      },
      {
        title: "Choisissez une analyse",
        text: "Résumé, extraction, risques, finance, rapport — chacune a son coût en crédits.",
      },
      {
        title: "Décidez plus vite",
        text: "Résultat structuré, exportable, historisé dans votre espace.",
      },
    ],
    useCasesTitle: "Fait pour les métiers du document",
    useCases: [
      {
        title: "Juridique",
        text: "Détection de clauses à risque, obligations, échéances et pénalités.",
      },
      {
        title: "Finance",
        text: "Extraction de montants, ratios, engagements et anomalies chiffrées.",
      },
      {
        title: "Conseil & RFP",
        text: "Synthèse d'appels d'offres et comparaison de dossiers volumineux.",
      },
      { title: "Opérations", text: "Comptes-rendus transformés en plans d'action assignables." },
    ],
    pricingTitle: "Des tarifs lisibles",
    pricingSubtitle: "Un plan gratuit pour tester, des plans payants pour industrialiser.",
    securityTitle: "Sécurité par défaut",
    security: [
      {
        title: "Cloisonnement strict",
        text: "Chaque document est isolé par utilisateur au niveau base de données.",
      },
      {
        title: "Crédits inviolables",
        text: "Le solde et le plan ne peuvent être modifiés que côté serveur.",
      },
      {
        title: "Limites anti-abus",
        text: "Rate limiting par utilisateur et journalisation de chaque appel IA.",
      },
    ],
    faqItems: [
      {
        q: "Comment fonctionnent les crédits ?",
        a: "Chaque analyse consomme un nombre de crédits fixe et affiché avant lancement. Les crédits sont rechargés à chaque cycle de facturation, et des packs supplémentaires sont disponibles.",
      },
      {
        q: "Mes documents sont-ils utilisés pour entraîner des modèles ?",
        a: "Non. Vos contenus servent uniquement à produire vos analyses et restent rattachés à votre compte.",
      },
      {
        q: "Puis-je annuler à tout moment ?",
        a: "Oui, les plans mensuels sont sans engagement. Le plan annuel offre deux mois gratuits.",
      },
      {
        q: "Quels formats sont supportés ?",
        a: "Texte collé et documents texte importés. Les analyses acceptent jusqu'à 24 000 caractères par exécution.",
      },
    ],
    ctaTitle: "Arrêtez de lire. Commencez à décider.",
    ctaSubtitle: "Créez votre compte et lancez votre première analyse en moins de deux minutes.",
  },
  auth: {
    login: "Connexion",
    signup: "Inscription",
    loginTab: "Se connecter",
    signupTab: "Créer un compte",
    email: "Email",
    password: "Mot de passe",
    fullName: "Nom complet",
    submitting: "Envoi…",
    backHome: "Retour à l'accueil",
    accountCreated: "Compte créé ! 50 crédits IA vous attendent.",
    welcomeBack: "Bon retour !",
    haveAccount: "Déjà un compte ?",
    noAccount: "Pas encore de compte ?",
    authFailed: "Échec de l'authentification",
    createTitle: "Créer votre compte",
    loginTitle: "Connexion",
    signupDescription: "50 crédits IA offerts, sans carte bancaire.",
    loginDescription: "Reprenez vos analyses là où vous les avez laissées.",
    google: "Continuer avec Google",
    googleError: "Connexion Google impossible pour le moment.",
    orByEmail: "ou par email",
    workEmail: "Email professionnel",
    fullNamePlaceholder: "Camille Dupont",
    emailPlaceholder: "vous@entreprise.com",
  },
  dashboard: {
    greeting: "Bonjour {name}",
    subtitle: "Lancez une analyse IA ou consultez votre consommation de crédits.",
    newDocument: "Nouveau document",
    assistant: "Assistant",
    creditsLeft: "Crédits restants",
    creditsConsumed: "{credits} crédits consommés au total",
    currentPlan: "Plan actuel",
    comparePlans: "Comparer les plans",
    documents: "Documents",
    unlimited: "illimités",
    historyRetention: "Historique conservé sans limite",
    historyRetentionDays: "Historique conservé {days} jours",
    recentDocuments: "Documents récents",
    recentAnalyses: "Dernières analyses",
    noDocuments: "Aucun document.",
    noAnalyses: "Vos analyses IA apparaîtront ici.",
    importOne: "Importez-en un",
    availableAnalyses: "Analyses disponibles",
    words: "{count} mots",
    signOut: "Déconnexion",
  },
  documents: {
    title: "Mes documents",
    subtitle: "Importez un texte ou un fichier, puis lancez les analyses IA.",
    newDocument: "Nouveau document",
    importDocument: "Importer un document",
    titleLabel: "Titre",
    titlePlaceholder: "Contrat de prestation — Acme",
    contentLabel: "Contenu",
    contentPlaceholder: "Collez ici le texte du contrat, rapport ou dossier à analyser…",
    words: "{count} mots",
    importTextFile: "Charger un fichier texte",
    importing: "Import…",
    importAndAnalyze: "Importer et analyser",
    fileTooBig: "Fichier trop volumineux (max 1,5 Mo de texte).",
    contentTooShort: "Le contenu doit contenir au moins 40 caractères.",
    imported: "Document importé",
    deleted: "Document supprimé",
    deleteLabel: "Supprimer",
    emptyTitle: "Aucun document",
    emptyText: "Importez votre premier contrat ou rapport pour découvrir les analyses IA de Lexia.",
    noSummary: "Aucune analyse pour le moment.",
    importFirst: "Importer un document",
    importedOn: "Importé le {date}",
  },
  documentDetail: {
    notFound: "Document introuvable",
    backToDocuments: "Retour aux documents",
    runAnalysis: "Lancer une analyse IA",
    questionPlaceholder: "Posez une question sur ce document…",
    askQuestion: "Interroger (1 cr.)",
    questionTooShort: "Posez une question d'au moins 5 caractères.",
    analysisDone: "Analyse terminée ({credits} crédits)",
    analysisFailed: "L'analyse a échoué.",
    analysesTab: "Analyses ({count})",
    contentTab: "Contenu",
    noAnalysisYet: "Aucune analyse encore. Choisissez une action ci-dessus.",
  },
  assistant: {
    title: "Assistant IA",
    subtitle: "Votre copilote connaît vos documents. 1 crédit par message.",
    allDocuments: "Tous mes documents",
    context: "Contexte",
    placeholder: "Votre message…",
    firstQuestion: "Posez votre première question à Lexia.",
    thinking: "Lexia réfléchit…",
    suggestions: [
      "Quels sont les risques principaux dans mes derniers documents ?",
      "Résume-moi l'essentiel de mon dernier contrat.",
      "Quelles actions dois-je prioriser cette semaine ?",
    ],
  },
  pricing: {
    title: "Payez à l'usage, pas à l'abonnement inutile",
    subtitle:
      "Chaque plan inclut un volume de crédits IA. Une analyse coûte entre 1 et 10 crédits, toujours affichés avant lancement.",
    monthly: "Mensuel",
    yearly: "Annuel",
    perMonth: "/ mois",
    perYear: "/ an",
    startFree: "Commencer gratuitement",
    upgrade: "Choisir",
    recommended: "Recommandé",
    perCredit: "crédits IA / mois",
    creditsIncluded: "{credits} crédits IA / mois",
    getStarted: "Commencer gratuitement",
    monthlyLabel: "Mensuel",
    yearlyLabel: "Annuel",
    yearlyNote: "2 mois offerts sur l'engagement annuel",
    monthlyNote: "Sans engagement, annulable à tout moment",
    currentPlan: "Plan actuel",
    customQuote: "Sur devis",
    creditsAIPerMonth: "{credits} crédits IA",
    active: "Plan actif",
    talkToExpert: "Parler à un expert",
    choose: "Choisir {name}",
  },
  admin: {
    title: "Administration",
    subtitle: "Gérez les utilisateurs, les rôles, les plans et les crédits.",
    deniedTitle: "Accès refusé",
    deniedText: "Cet espace est réservé aux administrateurs.",
    backToDashboard: "Retour au tableau de bord",
    totalUsers: "Utilisateurs",
    totalAdmins: "Administrateurs",
    totalCreditsUsed: "Crédits consommés",
    totalCredits: "Crédits distribués",
    usersTable: "Utilisateurs",
    name: "Nom",
    email: "Email",
    plan: "Plan",
    credits: "Crédits",
    used: "Consommés",
    role: "Rôle",
    actions: "Actions",
    promote: "Promouvoir",
    demote: "Rétrograder",
    add: "Ajouter",
    addCredits: "Ajouter des crédits",
    roleAdmin: "Admin",
    roleUser: "Utilisateur",
    roleUpdated: "Rôle mis à jour",
    userUpdated: "Utilisateur mis à jour",
    error: "Une erreur est survenue.",
    loading: "Chargement des utilisateurs…",
    noUsers: "Aucun utilisateur.",
    plan_free: "Free",
    plan_pro: "Pro",
    plan_business: "Business",
    plan_enterprise: "Enterprise",
  },
  errors: {
    notFoundTitle: "Page introuvable",
    notFoundText: "Cette page n'existe pas ou a été déplacée.",
    backHome: "Retour à l'accueil",
    pageErrorTitle: "Cette page n'a pas pu se charger",
    pageErrorText: "Une erreur est survenue. Réessaie ou reviens à l'accueil.",
    retry: "Réessayer",
    home: "Accueil",
  },
};

export type Translation = typeof fr;

const en: Translation = {
  langName: "English",
  nav: {
    dashboard: "Dashboard",
    documents: "Documents",
    assistant: "Assistant",
    features: "Features",
    useCases: "Use cases",
    demo: "AI demo",
    pricing: "Pricing",
    faq: "FAQ",
    mySpace: "My workspace",
    signIn: "Sign in",
    startFree: "Start free",
    menu: "Menu",
    logout: "Sign out",
    theme: "Switch theme",
    language: "Switch language",
    admin: "Admin",
  },
  common: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    back: "Back",
    retry: "Retry",
    home: "Home",
    search: "Search",
    close: "Close",
  },
  credits: {
    remaining: "{credits} credits",
    short: "{credits} cr.",
  },
  features: {
    summary: {
      label: "Smart summary",
      description: "Structured synthesis in seconds, ready to share.",
    },
    extract: {
      label: "Data extraction",
      description: "Dates, amounts, parties, obligations: structured automatically.",
    },
    qa: {
      label: "Questions / Answers",
      description: "Ask any document questions in natural language.",
    },
    risk: {
      label: "Risk analysis",
      description: "Sensitive clauses detected, scored and rewritten.",
    },
    report: {
      label: "Report generation",
      description: "A complete, structured, deliverable client report.",
    },
    actions: {
      label: "Action plan",
      description: "Turn a document into concrete, prioritized tasks.",
    },
    finance: {
      label: "Financial analysis",
      description: "Indicators, trends and anomalies explained simply.",
    },
    compare: {
      label: "Comparison",
      description: "Detect gaps between two versions of a document.",
    },
    assistant: {
      label: "AI assistant",
      description: "A copilot that knows your documents and your context.",
    },
    search: {
      label: "Smart search",
      description: "Find the right information across all your documents.",
    },
  },
  site: {
    tagline: "The document intelligence that turns every file into a decision.",
    product: "Product",
    company: "Company",
    start: "Get started",
    pricing: "Pricing",
    faq: "FAQ",
    signIn: "Sign in",
    createAccount: "Create account",
    createAccountFree: "Create my free account",
    creditsOffer: "50 free AI credits, no credit card required.",
    rights: "All rights reserved.",
  },
  meta: {
    homeTitle: "Lexia — The AI that reads your documents for you",
    homeDescription:
      "Contracts, reports, invoices: Lexia summarizes, extracts key data, flags risks and generates professional reports with AI.",
    pricingTitle: "Pricing — Lexia, AI document analysis",
    pricingDescription:
      "Free, Pro, Business and Enterprise plans: AI credits included, monthly or yearly billing, no commitment.",
    authTitle: "Sign in — Lexia",
    authDescription: "Sign in to Lexia to analyze your documents with AI and track your credits.",
    dashboardTitle: "Dashboard — Lexia",
    dashboardDescription:
      "Track your AI credits and analyzed documents and launch new analyses from your Lexia workspace.",
    documentsTitle: "My documents — Lexia",
    documentsDescription:
      "Import your contracts and reports then run AI analyses: summary, extraction, risks and action plan.",
    documentDetailTitle: "Document analysis — Lexia",
    documentDetailDescription:
      "Run summaries, data extraction, risk analysis or full reports on your document with Lexia AI.",
    assistantTitle: "AI assistant — Lexia",
    assistantDescription:
      "Chat with the Lexia copilot: it knows your documents and gives actionable recommendations.",
  },
  landing: {
    heroBadge: "AI-powered document analysis",
    heroTitle1: "Your documents, read and understood",
    heroTitleHighlight: "in 30 seconds",
    heroSubtitle:
      "Lexia turns contracts, reports and files into reliable summaries, structured data, identified risks and reports ready to send.",
    heroCta1: "Start free",
    heroCta2: "See pricing",
    heroFreeNote: "50 free AI credits · no credit card · encrypted data",
    demoSummary: "AI summary",
    demoRisks: "Detected risks",
    demoLines: [
      "Service contract, 24 months, tacit renewal.",
      "Late payment penalty: 1.5% per commenced week.",
      "Asymmetric termination clause favoring the client.",
    ],
    demoRiskLabels: ["Unilateral termination", "Missing price indexing", "Limited confidentiality"],
    riskHigh: "High",
    riskMedium: "Medium",
    riskLow: "Low",
    featuresTitle: "A suite of AI analyses, billed per credit",
    featuresSubtitle: "Every analysis has a transparent cost. You only pay for what you use.",
    howTitle: "Three steps, zero friction",
    steps: [
      {
        title: "Drop your document",
        text: "Paste or import a contract, report or meeting minutes.",
      },
      {
        title: "Pick an analysis",
        text: "Summary, extraction, risks, finance, report — each has its credit cost.",
      },
      { title: "Decide faster", text: "Structured, exportable results, saved in your workspace." },
    ],
    useCasesTitle: "Built for document-driven jobs",
    useCases: [
      { title: "Legal", text: "Detect risky clauses, obligations, deadlines and penalties." },
      { title: "Finance", text: "Extract amounts, ratios, commitments and figure anomalies." },
      {
        title: "Consulting & RFP",
        text: "Synthesize requests for proposals and compare large files.",
      },
      { title: "Operations", text: "Turn meeting minutes into assignable action plans." },
    ],
    pricingTitle: "Transparent pricing",
    pricingSubtitle: "A free plan to try, paid plans to scale.",
    securityTitle: "Secure by default",
    security: [
      {
        title: "Strict isolation",
        text: "Each document is isolated per user at the database level.",
      },
      { title: "Tamper-proof credits", text: "Balance and plan can only be changed server-side." },
      { title: "Anti-abuse limits", text: "Per-user rate limiting and logging of every AI call." },
    ],
    faqItems: [
      {
        q: "How do credits work?",
        a: "Each analysis consumes a fixed number of credits, shown before launch. Credits reset every billing cycle, and extra packs are available.",
      },
      {
        q: "Are my documents used to train models?",
        a: "No. Your content is only used to produce your analyses and stays attached to your account.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes, monthly plans have no commitment. The yearly plan includes two free months.",
      },
      {
        q: "Which formats are supported?",
        a: "Pasted text and imported text documents. Analyses accept up to 24,000 characters per run.",
      },
    ],
    ctaTitle: "Stop reading. Start deciding.",
    ctaSubtitle: "Create your account and run your first analysis in under two minutes.",
  },
  auth: {
    login: "Sign in",
    signup: "Sign up",
    loginTab: "Sign in",
    signupTab: "Create account",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    submitting: "Submitting…",
    backHome: "Back to home",
    accountCreated: "Account created! 50 AI credits are waiting for you.",
    welcomeBack: "Welcome back!",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account yet?",
    authFailed: "Authentication failed",
    createTitle: "Create your account",
    loginTitle: "Sign in",
    signupDescription: "50 free AI credits, no credit card required.",
    loginDescription: "Pick up your analyses where you left off.",
    google: "Continue with Google",
    googleError: "Google sign-in is unavailable right now.",
    orByEmail: "or by email",
    workEmail: "Work email",
    fullNamePlaceholder: "Camille Dupont",
    emailPlaceholder: "you@company.com",
  },
  dashboard: {
    greeting: "Hello {name}",
    subtitle: "Launch an AI analysis or check your credit usage.",
    newDocument: "New document",
    assistant: "Assistant",
    creditsLeft: "Credits left",
    creditsConsumed: "{credits} credits used in total",
    currentPlan: "Current plan",
    comparePlans: "Compare plans",
    documents: "Documents",
    unlimited: "unlimited",
    historyRetention: "Unlimited history",
    historyRetentionDays: "{days} days of history",
    recentDocuments: "Recent documents",
    recentAnalyses: "Recent analyses",
    noDocuments: "No documents.",
    noAnalyses: "Your AI analyses will appear here.",
    importOne: "Import one",
    availableAnalyses: "Available analyses",
    words: "{count} words",
    signOut: "Sign out",
  },
  documents: {
    title: "My documents",
    subtitle: "Import text or a file, then run AI analyses.",
    newDocument: "New document",
    importDocument: "Import a document",
    titleLabel: "Title",
    titlePlaceholder: "Service contract — Acme",
    contentLabel: "Content",
    contentPlaceholder: "Paste the text of the contract, report or file to analyze…",
    words: "{count} words",
    importTextFile: "Load a text file",
    importing: "Importing…",
    importAndAnalyze: "Import and analyze",
    fileTooBig: "File too large (max 1.5 MB of text).",
    contentTooShort: "Content must be at least 40 characters.",
    imported: "Document imported",
    deleted: "Document deleted",
    deleteLabel: "Delete",
    emptyTitle: "No documents",
    emptyText: "Import your first contract or report to discover Lexia's AI analyses.",
    noSummary: "No analysis yet.",
    importFirst: "Import a document",
    importedOn: "Imported on {date}",
  },
  documentDetail: {
    notFound: "Document not found",
    backToDocuments: "Back to documents",
    runAnalysis: "Run an AI analysis",
    questionPlaceholder: "Ask a question about this document…",
    askQuestion: "Ask (1 cr.)",
    questionTooShort: "Ask a question of at least 5 characters.",
    analysisDone: "Analysis complete ({credits} credits)",
    analysisFailed: "The analysis failed.",
    analysesTab: "Analyses ({count})",
    contentTab: "Content",
    noAnalysisYet: "No analysis yet. Choose an action above.",
  },
  assistant: {
    title: "AI Assistant",
    subtitle: "Your copilot knows your documents. 1 credit per message.",
    allDocuments: "All my documents",
    context: "Context",
    placeholder: "Your message…",
    firstQuestion: "Ask Lexia your first question.",
    thinking: "Lexia is thinking…",
    suggestions: [
      "What are the main risks in my latest documents?",
      "Summarize the essentials of my last contract.",
      "Which actions should I prioritize this week?",
    ],
  },
  pricing: {
    title: "Pay for usage, not useless subscriptions",
    subtitle:
      "Every plan includes a volume of AI credits. An analysis costs between 1 and 10 credits, always shown before launch.",
    monthly: "Monthly",
    yearly: "Yearly",
    perMonth: "/ mo",
    perYear: "/ yr",
    startFree: "Start free",
    upgrade: "Choose",
    recommended: "Recommended",
    perCredit: "AI credits / month",
    creditsIncluded: "{credits} AI credits / month",
    getStarted: "Start free",
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly",
    yearlyNote: "2 months free on yearly billing",
    monthlyNote: "No commitment, cancel anytime",
    currentPlan: "Current plan",
    customQuote: "Custom quote",
    creditsAIPerMonth: "{credits} AI credits",
    active: "Active plan",
    talkToExpert: "Talk to an expert",
    choose: "Choose {name}",
  },
  admin: {
    title: "Administration",
    subtitle: "Manage users, roles, plans and credits.",
    deniedTitle: "Access denied",
    deniedText: "This area is reserved for administrators.",
    backToDashboard: "Back to dashboard",
    totalUsers: "Users",
    totalAdmins: "Admins",
    totalCreditsUsed: "Credits used",
    totalCredits: "Credits issued",
    usersTable: "Users",
    name: "Name",
    email: "Email",
    plan: "Plan",
    credits: "Credits",
    used: "Used",
    role: "Role",
    actions: "Actions",
    promote: "Promote",
    demote: "Demote",
    add: "Add",
    addCredits: "Add credits",
    roleAdmin: "Admin",
    roleUser: "User",
    roleUpdated: "Role updated",
    userUpdated: "User updated",
    error: "Something went wrong.",
    loading: "Loading users…",
    noUsers: "No users.",
    plan_free: "Free",
    plan_pro: "Pro",
    plan_business: "Business",
    plan_enterprise: "Enterprise",
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundText: "This page doesn't exist or has been moved.",
    backHome: "Back to home",
    pageErrorTitle: "This page failed to load",
    pageErrorText: "Something went wrong. Try again or go back home.",
    retry: "Retry",
    home: "Home",
  },
};

const ar: Translation = {
  langName: "العربية",
  nav: {
    dashboard: "لوحة التحكم",
    documents: "المستندات",
    assistant: "المساعد",
    features: "الميزات",
    useCases: "حالات الاستخدام",
    demo: "عرض الذكاء الاصطناعي",
    pricing: "الأسعار",
    faq: "الأسئلة الشائعة",
    mySpace: "مساحتي",
    signIn: "تسجيل الدخول",
    startFree: "ابدأ مجانًا",
    menu: "القائمة",
    logout: "تسجيل الخروج",
    theme: "تبديل المظهر",
    language: "تبديل اللغة",
    admin: "الإدارة",
  },
  common: {
    loading: "جارٍ التحميل…",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    back: "رجوع",
    retry: "إعادة المحاولة",
    home: "الرئيسية",
    search: "بحث",
    close: "إغلاق",
  },
  credits: {
    remaining: "الرصيد: {credits} نقطة",
    short: "{credits} نقطة",
  },
  features: {
    summary: {
      label: "ملخص ذكي",
      description: "تركيب منظم في ثوانٍ، جاهز للمشاركة.",
    },
    extract: {
      label: "استخراج البيانات",
      description: "التواريخ والمبالغ والأطراف والالتزامات: تُنظَّم تلقائيًا.",
    },
    qa: {
      label: "أسئلة / إجابات",
      description: "اطرح على أي مستند أسئلة باللغة الطبيعية.",
    },
    risk: {
      label: "تحليل المخاطر",
      description: "اكتشاف البنود الحساسة وتقييمها وإعادة صياغتها.",
    },
    report: {
      label: "توليد تقرير",
      description: "تقرير عميل كامل ومنظم وجاهز للتسليم.",
    },
    actions: {
      label: "خطة عمل",
      description: "تحويل المستند إلى مهام ملموسة ومرتبة حسب الأولوية.",
    },
    finance: {
      label: "تحليل مالي",
      description: "مؤشرات واتجاهات وحالات شاذة مشروحة ببساطة.",
    },
    compare: {
      label: "مقارنة",
      description: "اكتشاف الفروقات بين نسختين من مستند.",
    },
    assistant: {
      label: "المساعد الذكي",
      description: "مساعد يعرف مستنداتك وسياقك.",
    },
    search: {
      label: "بحث ذكي",
      description: "اعثر على المعلومة الصحيحة في جميع مستنداتك.",
    },
  },
  site: {
    tagline: "ذكاء المستندات الذي يحوّل كل ملف إلى قرار.",
    product: "المنتج",
    company: "الشركة",
    start: "ابدأ",
    pricing: "الأسعار",
    faq: "الأسئلة الشائعة",
    signIn: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    createAccountFree: "أنشئ حسابي المجاني",
    creditsOffer: "50 نقطة ذكاء اصطناعي مجانية بدون بطاقة بنكية.",
    rights: "جميع الحقوق محفوظة.",
  },
  meta: {
    homeTitle: "Lexia — الذكاء الاصطناعي الذي يحلّل مستنداتك في ثوانٍ",
    homeDescription:
      "العقود والتقارير والفواتير: تُلخّص Lexia المستندات وتستخرج البيانات الأساسية وتكتشف المخاطر وتولّد تقارير احترافية بالذكاء الاصطناعي.",
    pricingTitle: "الأسعار — Lexia، تحليل المستندات بالذكاء الاصطناعي",
    pricingDescription:
      "باقات مجانية وPro وBusiness وEnterprise: نقاط ذكاء اصطناعي مضمّنة، فوترة شهرية أو سنوية بدون التزام.",
    authTitle: "تسجيل الدخول — Lexia",
    authDescription: "سجّل دخولك إلى Lexia لتحليل مستنداتك بالذكاء الاصطناعي ومتابعة رصيدك.",
    dashboardTitle: "لوحة التحكم — Lexia",
    dashboardDescription:
      "تابع نقاط الذكاء الاصطناعي والمستندات المُحلَّلة وابدأ تحليلات جديدة من مساحتك في Lexia.",
    documentsTitle: "مستنداتي — Lexia",
    documentsDescription:
      "استورد عقودك وتقاريرك ثم أطلق تحليلات الذكاء الاصطناعي: ملخص، استخراج، مخاطر وخطة عمل.",
    documentDetailTitle: "تحليل مستند — Lexia",
    documentDetailDescription:
      "أطلق الملخصات واستخراج البيانات وتحليل المخاطر أو التقارير الكاملة على مستندك بذكاء Lexia.",
    assistantTitle: "المساعد الذكي — Lexia",
    assistantDescription: "تحدث مع المساعد Lexia: يعرف مستنداتك ويجيب بتوصيات قابلة للتنفيذ.",
  },
  landing: {
    heroBadge: "تحليل مستندات معزّز بالذكاء الاصطناعي",
    heroTitle1: "مستنداتك تُقرأ وتُفهم",
    heroTitleHighlight: "في 30 ثانية",
    heroSubtitle:
      "تحوّل Lexia العقود والتقارير والملفات إلى ملخصات موثوقة وبيانات منظمة ومخاطر محدّدة وتقارير جاهزة للإرسال.",
    heroCta1: "ابدأ مجانًا",
    heroCta2: "اطّلع على الأسعار",
    heroFreeNote: "50 نقطة ذكاء اصطناعي مجانية · بدون بطاقة بنكية · بيانات مشفّرة",
    demoSummary: "ملخص الذكاء الاصطناعي",
    demoRisks: "المخاطر المكتشفة",
    demoLines: [
      "عقد خدمات، 24 شهرًا، تجديد ضمني.",
      "غرامة تأخير: 1.5% عن كل أسبوع يبدأ.",
      "شرط إنهاء غير متوازن لصالح العميل.",
    ],
    demoRiskLabels: ["الإنهاء من طرف واحد", "غياب فهرسة الأسعار", "سرّية محدودة"],
    riskHigh: "مرتفع",
    riskMedium: "متوسط",
    riskLow: "منخفض",
    featuresTitle: "سلسلة تحليلات ذكاء اصطناعي تُدفع بالنقاط",
    featuresSubtitle: "لكل تحليل تكلفة شفافة. تدفع فقط مقابل ما تستخدمه.",
    howTitle: "ثلاث خطوات بدون تعقيد",
    steps: [
      { title: "أضِف مستندك", text: "الصق أو استورد عقدًا أو تقريرًا أو محضر اجتماع." },
      {
        title: "اختر تحليلًا",
        text: "ملخص، استخراج، مخاطر، مالية، تقرير — لكلٍّ تكلفته بالنقاط.",
      },
      { title: "قرّر أسرع", text: "نتيجة منظمة وقابلة للتصدير ومحفوظة في مساحتك." },
    ],
    useCasesTitle: "مصمَّم لمهن المستندات",
    useCases: [
      { title: "الشؤون القانونية", text: "كشف الشروط الخطرة والالتزامات والمواعيد والغرامات." },
      { title: "التمويل", text: "استخراج المبالغ والنسب والالتزامات والحالات الشاذة في الأرقام." },
      {
        title: "الاستشارات والعطاءات",
        text: "تلخيص طلبات العروض ومقارنة الملفات الكبيرة.",
      },
      { title: "العمليات", text: "تحويل محاضر الاجتماعات إلى خطط عمل قابلة للتكليف." },
    ],
    pricingTitle: "أسعار واضحة",
    pricingSubtitle: "باقة مجانية للتجربة، وباقات مدفوعة للتوسّع.",
    securityTitle: "الأمان افتراضيًا",
    security: [
      { title: "عزل صارم", text: "كل مستند معزول لكل مستخدم على مستوى قاعدة البيانات." },
      { title: "نقاط محمية", text: "لا يمكن تعديل الرصيد والباقة إلا من جهة الخادم." },
      {
        title: "حدود مضادة لإساءة الاستخدام",
        text: "حدود معدل لكل مستخدم وتسجيل لكل استدعاء ذكاء اصطناعي.",
      },
    ],
    faqItems: [
      {
        q: "كيف تعمل النقاط؟",
        a: "يستهلك كل تحليل عددًا ثابتًا من النقاط يُعرض قبل البدء. تُجدَّد النقاط كل دورة فوترة، وتتوفر باقات إضافية.",
      },
      {
        q: "هل تُستخدم مستنداتي لتدريب النماذج؟",
        a: "لا. تُستخدم محتوياتك فقط لإنتاج تحليلاتك وتبقى مرتبطة بحسابك.",
      },
      {
        q: "هل يمكنني الإلغاء في أي وقت؟",
        a: "نعم، الباقات الشهرية بدون التزام. تمنح الباقة السنوية شهرين مجانًا.",
      },
      {
        q: "ما الصيغ المدعومة؟",
        a: "نص لاصق ومستندات نصية مستوردة. تقبل التحليلات حتى 24,000 حرف لكل عملية.",
      },
    ],
    ctaTitle: "توقف عن القراءة. ابدأ في اتخاذ القرار.",
    ctaSubtitle: "أنشئ حسابك وأطلق أول تحليل في أقل من دقيقتين.",
  },
  auth: {
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    loginTab: "تسجيل الدخول",
    signupTab: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    submitting: "جارٍ الإرسال…",
    backHome: "العودة إلى الرئيسية",
    accountCreated: "تم إنشاء الحساب! 50 نقطة ذكاء اصطناعي في انتظارك.",
    welcomeBack: "مرحبًا بعودتك!",
    haveAccount: "لديك حساب بالفعل؟",
    noAccount: "ليس لديك حساب بعد؟",
    authFailed: "فشل المصادقة",
    createTitle: "أنشئ حسابك",
    loginTitle: "تسجيل الدخول",
    signupDescription: "50 نقطة ذكاء اصطناعي مجانية بدون بطاقة بنكية.",
    loginDescription: "استأنف تحليلاتك من حيث توقفت.",
    google: "المتابعة عبر Google",
    googleError: "تعذّر تسجيل الدخول عبر Google حاليًا.",
    orByEmail: "أو عبر البريد الإلكتروني",
    workEmail: "البريد المهني",
    fullNamePlaceholder: "كاميل دوبون",
    emailPlaceholder: "you@company.com",
  },
  dashboard: {
    greeting: "مرحبًا {name}",
    subtitle: "أطلق تحليل ذكاء اصطناعي أو اطّلع على استهلاكك من النقاط.",
    newDocument: "مستند جديد",
    assistant: "المساعد",
    creditsLeft: "النقاط المتبقية",
    creditsConsumed: "تم استهلاك {credits} نقطة إجمالًا",
    currentPlan: "الباقة الحالية",
    comparePlans: "قارن الباقات",
    documents: "المستندات",
    unlimited: "غير محدود",
    historyRetention: "سجلّ محفوظ بدون حد",
    historyRetentionDays: "سجلّ محفوظ {days} أيام",
    recentDocuments: "المستندات الأخيرة",
    recentAnalyses: "التحليلات الأخيرة",
    noDocuments: "لا توجد مستندات.",
    noAnalyses: "ستظهر تحليلات الذكاء الاصطناعي هنا.",
    importOne: "استورد واحدًا",
    availableAnalyses: "التحليلات المتاحة",
    words: "{count} كلمة",
    signOut: "تسجيل الخروج",
  },
  documents: {
    title: "مستنداتي",
    subtitle: "استورد نصًا أو ملفًا ثم أطلق تحليلات الذكاء الاصطناعي.",
    newDocument: "مستند جديد",
    importDocument: "استيراد مستند",
    titleLabel: "العنوان",
    titlePlaceholder: "عقد خدمات — Acme",
    contentLabel: "المحتوى",
    contentPlaceholder: "الصق نص العقد أو التقرير أو الملف المراد تحليله…",
    words: "{count} كلمة",
    importTextFile: "تحميل ملف نصي",
    importing: "جارٍ الاستيراد…",
    importAndAnalyze: "استيراد وتحليل",
    fileTooBig: "الملف كبير جدًا (الحد الأقصى 1.5 ميجابايت نص).",
    contentTooShort: "يجب أن يحتوي المحتوى على 40 حرفًا على الأقل.",
    imported: "تم استيراد المستند",
    deleted: "تم حذف المستند",
    deleteLabel: "حذف",
    emptyTitle: "لا توجد مستندات",
    emptyText: "استورد أول عقد أو تقرير لاكتشاف تحليلات Lexia بالذكاء الاصطناعي.",
    noSummary: "لا توجد تحليلات بعد.",
    importFirst: "استيراد مستند",
    importedOn: "استُورد في {date}",
  },
  documentDetail: {
    notFound: "المستند غير موجود",
    backToDocuments: "العودة إلى المستندات",
    runAnalysis: "إطلاق تحليل ذكاء اصطناعي",
    questionPlaceholder: "اطرح سؤالًا حول هذا المستند…",
    askQuestion: "اسأل (نقطة واحدة)",
    questionTooShort: "اطرح سؤالًا من 5 أحرف على الأقل.",
    analysisDone: "اكتمل التحليل ({credits} نقطة)",
    analysisFailed: "فشل التحليل.",
    analysesTab: "التحليلات ({count})",
    contentTab: "المحتوى",
    noAnalysisYet: "لا توجد تحليلات بعد. اختر إجراءً أعلاه.",
  },
  assistant: {
    title: "المساعد الذكي",
    subtitle: "مساعدك يعرف مستنداتك. نقطة واحدة لكل رسالة.",
    allDocuments: "جميع مستنداتي",
    context: "السياق",
    placeholder: "رسالتك…",
    firstQuestion: "اطرح سؤالك الأول على Lexia.",
    thinking: "Lexia تفكّر…",
    suggestions: [
      "ما المخاطر الرئيسية في أحدث مستنداتي؟",
      "لخّص لي جوهر آخر عقد لي.",
      "ما الإجراءات التي يجب أن أوليها الأولوية هذا الأسبوع؟",
    ],
  },
  pricing: {
    title: "ادفع مقابل الاستخدام لا الاشتراكات الزائدة",
    subtitle:
      "تتضمن كل باقة حجمًا من نقاط الذكاء الاصطناعي. يكلف التحليل بين 1 و10 نقاط، تُعرض دائمًا قبل البدء.",
    monthly: "شهري",
    yearly: "سنوي",
    perMonth: "/ شهر",
    perYear: "/ سنة",
    startFree: "ابدأ مجانًا",
    upgrade: "اختر",
    recommended: "موصى به",
    perCredit: "نقاط ذكاء اصطناعي / شهر",
    creditsIncluded: "{credits} نقطة ذكاء اصطناعي / شهر",
    getStarted: "ابدأ مجانًا",
    monthlyLabel: "شهري",
    yearlyLabel: "سنوي",
    yearlyNote: "شهران مجانًا عند الاشتراك السنوي",
    monthlyNote: "بدون التزام، إلغاء في أي وقت",
    currentPlan: "الباقة الحالية",
    customQuote: "حسب الطلب",
    creditsAIPerMonth: "{credits} نقطة ذكاء اصطناعي",
    active: "الباقة النشطة",
    talkToExpert: "تحدث إلى خبير",
    choose: "اختر {name}",
  },
  admin: {
    title: "الإدارة",
    subtitle: "أدر المستخدمين والأدوار والباقات والنقاط.",
    deniedTitle: "تم رفض الوصول",
    deniedText: "هذه المساحة مخصصة للمسؤولين فقط.",
    backToDashboard: "العودة إلى لوحة التحكم",
    totalUsers: "المستخدمون",
    totalAdmins: "المسؤولون",
    totalCreditsUsed: "النقاط المستهلكة",
    totalCredits: "النقاط الموزعة",
    usersTable: "المستخدمون",
    name: "الاسم",
    email: "البريد الإلكتروني",
    plan: "الباقة",
    credits: "النقاط",
    used: "المستهلكة",
    role: "الدور",
    actions: "إجراءات",
    promote: "ترقية",
    demote: "خفض",
    add: "إضافة",
    addCredits: "إضافة نقاط",
    roleAdmin: "مسؤول",
    roleUser: "مستخدم",
    roleUpdated: "تم تحديث الدور",
    userUpdated: "تم تحديث المستخدم",
    error: "حدث خطأ ما.",
    loading: "جارٍ تحميل المستخدمين…",
    noUsers: "لا يوجد مستخدمون.",
    plan_free: "مجانية",
    plan_pro: "Pro",
    plan_business: "Business",
    plan_enterprise: "Enterprise",
  },
  errors: {
    notFoundTitle: "الصفحة غير موجودة",
    notFoundText: "هذه الصفحة غير موجودة أو تم نقلها.",
    backHome: "العودة إلى الرئيسية",
    pageErrorTitle: "تعذّر تحميل هذه الصفحة",
    pageErrorText: "حدث خطأ ما. حاول مرة أخرى أو عد إلى الرئيسية.",
    retry: "إعادة المحاولة",
    home: "الرئيسية",
  },
};

export const translations: Record<Locale, Translation> = { fr, en, ar };

type NestedKey<T> = {
  [K in keyof T & string]: T[K] extends string
    ? `${K}`
    : T[K] extends readonly unknown[]
      ? `${K}`
      : T[K] extends object
        ? `${K}.${NestedKey<T[K]>}`
        : `${K}`;
}[keyof T & string];

export type TranslationKey = NestedKey<Translation>;

type Params = Record<string, string | number>;

function getValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && Array.isArray(acc))
      return (acc as unknown[])[Number(key)] ?? undefined;
    if (acc && typeof acc === "object" && key in (acc as object))
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function interpolate(value: string, params?: Params): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}

export function getT(lang: Locale) {
  const dict = translations[lang] ?? fr;
  return (key: TranslationKey, params?: Params): string => {
    const value = getValue(dict, key);
    const fallback = getValue(fr, key);
    const raw = typeof value === "string" ? value : typeof fallback === "string" ? fallback : key;
    return interpolate(raw, params);
  };
}

export function getListT(lang: Locale) {
  const dict = translations[lang] ?? fr;
  return (key: TranslationKey): string[] => {
    const value = getValue(dict, key);
    const fallback = getValue(fr, key);
    const list = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
    return list.map((item) => (typeof item === "string" ? interpolate(item) : String(item)));
  };
}

export function featureLabelKey(key: string): TranslationKey {
  return `features.${key}.label` as TranslationKey;
}

export function featureDescriptionKey(key: string): TranslationKey {
  return `features.${key}.description` as TranslationKey;
}

const I18nContext = createContext<{
  lang: Locale;
  setLang: (lang: Locale) => void;
  toggleLang: () => void;
  t: ReturnType<typeof getT>;
  tList: ReturnType<typeof getListT>;
} | null>(null);

const STORAGE_KEY = "lexia.lang";

function detectLang(): Locale {
  if (typeof window === "undefined") return "fr";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "en" || saved === "ar") return saved;
  const navLang = (window.navigator.language ?? "fr").toLowerCase();
  if (navLang.startsWith("ar")) return "ar";
  if (navLang.startsWith("en")) return "en";
  return "fr";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(detectLang);

  const setLang = useCallback((next: Locale) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "fr" ? "en" : "fr";
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LOCALES.includes(lang) ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t: getT(lang), tList: getListT(lang) }),
    [lang, setLang, toggleLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Locale)}
      aria-label={lang === "fr" ? "Changer de langue" : "Switch language"}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {l === "fr" ? "FR" : l === "en" ? "EN" : "ع"}
        </option>
      ))}
    </select>
  );
}
