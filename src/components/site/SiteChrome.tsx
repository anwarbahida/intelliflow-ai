import { Link } from "@tanstack/react-router";
import { Moon, Sun, Menu, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme";
import { useSessionUser } from "@/hooks/useProfile";
import { useI18n, LanguageToggle } from "@/lib/i18n";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Sparkles className="size-4 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          Lex<span className="text-primary">ia</span>
        </span>
      )}
    </Link>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("nav.theme")}>
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useSessionUser();
  const { t } = useI18n();

  const links = [
    { label: t("nav.features"), href: "/#features" },
    { label: t("nav.useCases"), href: "/#use-cases" },
    { label: t("nav.demo"), href: "/#demo" },
    { label: t("nav.pricing"), href: "/pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link to="/dashboard">{t("nav.mySpace")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("nav.startFree")}
                </Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {link.label}
                  </a>
                ))}
                <Button asChild className="mt-4">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    {t("nav.startFree")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth">{t("nav.signIn")}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/60 bg-surface/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t("site.tagline")}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t("site.product")}</p>
          {[
            { label: t("nav.features"), href: "/#features" },
            { label: t("nav.demo"), href: "/#demo" },
            { label: t("nav.useCases"), href: "/#use-cases" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t("site.company")}</p>
          <Link to="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">
            {t("site.pricing")}
          </Link>
          <a href="/#faq" className="block text-sm text-muted-foreground hover:text-foreground">
            {t("site.faq")}
          </a>
          <Link to="/auth" className="block text-sm text-muted-foreground hover:text-foreground">
            {t("site.signIn")}
          </Link>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t("site.start")}</p>
          <p className="text-sm text-muted-foreground">{t("site.creditsOffer")}</p>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              {t("site.createAccount")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lexia. {t("site.rights")}
      </div>
    </footer>
  );
}
