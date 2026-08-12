import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export function useSessionUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useProfile() {
  const { user } = useSessionUser();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, email, full_name, plan, billing_cycle, credits, credits_used, onboarding_completed, goal, company, referral_code",
          )
          .eq("id", user!.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);
      return {
        profile,
        isAdmin: Boolean(roles?.some((r) => r.role === "admin")),
      };
    },
  });
}

export function planLimits(plan: string | undefined) {
  switch (plan) {
    case "pro":
      return { documents: Infinity, historyDays: Infinity, premium: true, label: "Pro" };
    case "business":
      return { documents: Infinity, historyDays: Infinity, premium: true, label: "Business" };
    case "enterprise":
      return { documents: Infinity, historyDays: Infinity, premium: true, label: "Enterprise" };
    default:
      return { documents: 5, historyDays: 7, premium: false, label: "Free" };
  }
}
