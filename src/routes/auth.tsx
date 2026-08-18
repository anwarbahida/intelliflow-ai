import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/SiteChrome";
import { useI18n } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { mode?: "signup" | "login"; redirect?: string } => ({
    mode: search["mode"] === "signup" ? "signup" : "login",
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : "",
  }),

  head: () => ({
    meta: [
      { title: "Connexion — Lexia" },
      {
        name: "description",
        content: "Connectez-vous à Lexia pour analyser vos documents avec l'IA et suivre vos crédits.",
      },
      { property: "og:title", content: "Connexion — Lexia" },
      { property: "og:description", content: "Accédez à votre espace d'analyse documentaire IA." },
    ],
  }),
  component: AuthPage,
});

function safePath(path?: string) {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(redirect), replace: true });
    });
  }, [navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safePath(redirect)}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
      }
      navigate({ to: safePath(redirect) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error(t("auth.googleError"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: safePath(redirect) });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="hero-glow" aria-hidden />
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-1 size-4" /> {t("common.home")}
            </Link>
          </Button>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {isSignup ? t("auth.createTitle") : t("auth.loginTitle")}
            </CardTitle>
            <CardDescription>
              {isSignup ? t("auth.signupDescription") : t("auth.loginDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button onClick={google} variant="outline" className="w-full" disabled={loading}>
              <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.96h5.27c-.23 1.4-1.63 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86S8.99 6.44 12.18 6.44c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.8 3.96 14.7 3.1 12.18 3.1 7.2 3.1 3.17 7.13 3.17 12.1s4.03 9 9.01 9c5.2 0 8.64-3.66 8.64-8.8 0-.6-.06-1.05-.47-1.2Z"
                />
              </svg>
              {t("auth.google")}
            </Button>

            <div className="relative text-center">
              <span className="relative z-10 bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t("auth.orByEmail")}
              </span>
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.workEmail")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                {isSignup ? t("auth.signupTab") : t("auth.loginTab")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
              <button
                type="button"
                onClick={() => setIsSignup((v) => !v)}
                className="font-medium text-primary hover:underline"
              >
                {isSignup ? t("auth.loginTab") : t("auth.signupTab")}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
