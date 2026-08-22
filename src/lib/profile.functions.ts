import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { parseInput } from "@/lib/utils";

const updateProfileSchema = z.object({
  fullName: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  goal: z.string().max(500).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(updateProfileSchema, input))
  .handler(async ({ data, context }) => {
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (data.fullName !== undefined) patch["full_name"] = data.fullName;
    if (data.company !== undefined) patch["company"] = data.company;
    if (data.goal !== undefined) patch["goal"] = data.goal;

    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error("Erreur lors de la mise à jour du profil.");
    return { ok: true };
  });
