-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  credits integer NOT NULL DEFAULT 50,
  credits_used integer NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  goal text,
  company text,
  referral_code text UNIQUE,
  referred_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,'user'),'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  credits integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage plans" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'violet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DOCUMENTS
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes integer NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  word_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ready',
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read documents" ON public.documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX documents_user_idx ON public.documents(user_id, created_at DESC);

-- ANALYSES
CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text,
  prompt text,
  result text,
  result_json jsonb,
  model text,
  credits_cost integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses" ON public.analyses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read analyses" ON public.analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX analyses_user_idx ON public.analyses(user_id, created_at DESC);

-- TEMPLATES
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  prompt text NOT NULL,
  kind text NOT NULL DEFAULT 'custom',
  is_premium boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates public read" ON public.templates FOR SELECT USING (is_active = true);
CREATE POLICY "admins manage templates" ON public.templates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AI USAGE LOGS
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  model text,
  credits integer NOT NULL DEFAULT 0,
  tokens integer NOT NULL DEFAULT 0,
  cost_estimate numeric NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage logs" ON public.ai_usage_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert own usage logs" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read usage logs" ON public.ai_usage_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ai_usage_user_idx ON public.ai_usage_logs(user_id, created_at DESC);

-- CREDIT TRANSACTIONS
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own credit tx" ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read credit tx" ON public.credit_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent_off integer NOT NULL DEFAULT 10,
  credits_bonus integer NOT NULL DEFAULT 0,
  max_redemptions integer NOT NULL DEFAULT 100,
  times_redeemed integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  target text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SEED PLANS
INSERT INTO public.plans (code,name,tagline,price_monthly,price_yearly,credits,features,is_featured,sort_order) VALUES
('free','Free','Pour découvrir la puissance de l''analyse IA',0,0,50,'["50 crédits IA / mois","5 documents actifs","Résumés et extraction de base","Historique 7 jours","1 projet"]'::jsonb,false,1),
('pro','Pro','Pour les indépendants et petites équipes',29,290,1500,'["1 500 crédits IA / mois","Documents illimités","Analyse de risques avancée","Assistant IA illimité","Historique complet","Templates premium","Export PDF & Markdown","Traitement prioritaire"]'::jsonb,true,2),
('business','Business','Pour les équipes qui traitent des volumes',99,990,6000,'["6 000 crédits IA / mois","Automatisations et lots","Analytics d''équipe","Collaboration & partage","Gestion des membres","Rapports personnalisés","Support prioritaire"]'::jsonb,false,3);

-- SEED TEMPLATES
INSERT INTO public.templates (title,description,category,prompt,kind,is_premium) VALUES
('Résumé exécutif','Un résumé d''une page prêt à envoyer à un dirigeant.','general','Rédige un résumé exécutif structuré du document : contexte, points clés, chiffres importants, risques, recommandations.','summary',false),
('Extraction de données clés','Extrait dates, montants, parties et obligations.','data','Extrais sous forme de liste structurée toutes les données clés du document : parties, dates, montants, durées, obligations, échéances.','extract',false),
('Analyse de risques contractuels','Détecte les clauses à risque et propose des reformulations.','legal','Analyse ce contrat : liste chaque clause à risque, son niveau de risque (faible/moyen/élevé), pourquoi, et une reformulation plus équilibrée.','risk',true),
('Questions/Réponses sur document','Interroge ton document en langage naturel.','general','Réponds à la question de l''utilisateur en te basant uniquement sur le document fourni, en citant les passages utiles.','qa',false),
('Rapport client complet','Génère un rapport professionnel prêt à livrer.','reporting','Génère un rapport professionnel complet à partir du document : synthèse, analyse détaillée, tableaux de données, conclusions et prochaines étapes.','report',true),
('Comparaison de versions','Compare deux documents et met en évidence les écarts.','legal','Compare les documents fournis et présente un tableau des différences importantes, avec l''impact de chaque écart.','compare',true),
('Plan d''action opérationnel','Transforme un document en tâches concrètes.','productivity','À partir du document, propose un plan d''action priorisé avec responsables suggérés, échéances et critères de réussite.','actions',false),
('Analyse financière','Interprète les chiffres et tendances d''un document.','finance','Analyse les données financières du document : indicateurs clés, tendances, anomalies, risques et recommandations chiffrées.','finance',true);