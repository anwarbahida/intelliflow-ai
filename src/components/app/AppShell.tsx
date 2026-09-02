import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  SquareStack,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { Logo, ThemeToggle } from "@/components/site/SiteChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useProfile, planLimits } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, RTL_LOCALES, LanguageToggle } from "@/lib/i18n";

type NavItem = { labelKey: string; to: string; icon: React.ElementType };

const userNav: NavItem[] = [
  { labelKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.documents", to: "/documents", icon: FileText },
  { labelKey: "nav.assistant", to: "/assistant", icon: Bot },
  { labelKey: "nav.search", to: "/search", icon: Search },
  { labelKey: "nav.templates", to: "/templates", icon: SquareStack },
  { labelKey: "nav.billing", to: "/billing", icon: CreditCard },
  { labelKey: "nav.pricing", to: "/my-pricing", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { labelKey: "nav.adminOverview", to: "/admin", icon: ShieldCheck },
  { labelKey: "nav.adminUsers", to: "/admin/users", icon: Users },
  { labelKey: "nav.adminActivity", to: "/admin/activity", icon: Activity },
  { labelKey: "nav.adminUsage", to: "/admin/usage", icon: BarChart3 },
];

const profileNav: NavItem[] = [{ labelKey: "nav.profile", to: "/profile", icon: User }];

function SidebarNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton asChild isActive={active} tooltip={t(item.labelKey as never)}>
              <Link to={item.to}>
                <Icon className="size-4" />
                <span>{t(item.labelKey as never)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SidebarInner() {
  const { data } = useProfile();
  const profile = data?.profile;
  const isAdmin = data?.isAdmin;
  const { t } = useI18n();

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-accent-foreground/60">
              {t("nav.adminSpace")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNav items={adminNav} />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-accent-foreground/60">
              {t("nav.userSpace")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNav items={userNav} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-accent-foreground/60">
            {t("nav.profile")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav items={profileNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Sparkles className="size-3 text-primary" />
              {t("credits.remaining", { credits: profile?.credits ?? 0 })}
            </Badge>
            <Badge className="text-xs">{planLimits(profile?.plan).label}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <LanguageToggle />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => supabase.auth.signOut()}
                aria-label={t("nav.logout")}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const side = RTL_LOCALES.includes(lang) ? "right" : "left";

  return (
    <SidebarProvider>
      <Sidebar side={side} collapsible="offcanvas">
        <SidebarInner />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:hidden">
          <SidebarTrigger>
            <Menu className="size-5" />
          </SidebarTrigger>
          <Logo />
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
