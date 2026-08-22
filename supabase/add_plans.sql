-- Ajout des plans Pro et Business (et Enterprise si absent)
-- Exécuter dans le SQL Editor de Supabase

-- Pro
INSERT INTO public.plans (code, name, tagline, price_monthly, price_yearly, credits, features, is_featured, sort_order)
VALUES (
  'pro',
  'Pro',
  'Pour les indépendants et petites équipes',
  29,
  290,
  1500,
  '["1 500 crédits IA / mois", "Documents illimités", "Analyse de risques avancée", "Assistant IA illimité", "Historique complet", "Templates premium", "Export PDF & Markdown", "Traitement prioritaire"]'::jsonb,
  true,
  2
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

-- Business
INSERT INTO public.plans (code, name, tagline, price_monthly, price_yearly, credits, features, is_featured, sort_order)
VALUES (
  'business',
  'Business',
  'Pour les équipes qui traitent des volumes',
  99,
  990,
  6000,
  '["6 000 crédits IA / mois", "Automatisations et lots", "Analytics d''équipe", "Collaboration & partage", "Gestion des membres", "Rapports personnalisés", "Support prioritaire"]'::jsonb,
  false,
  3
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

-- Enterprise (50 000 crédits, prix fixe)
INSERT INTO public.plans (code, name, tagline, price_monthly, price_yearly, credits, features, is_featured, sort_order)
VALUES (
  'enterprise',
  'Enterprise',
  'Sur mesure, sécurité et volumes illimités',
  499,
  4990,
  50000,
  '["50 000 crédits IA / mois", "Documents illimités", "SSO & contrôles avancés", "Modèles IA dédiés", "SLA et support dédié", "Onboarding accompagné", "Limites personnalisables"]'::jsonb,
  false,
  4
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;
