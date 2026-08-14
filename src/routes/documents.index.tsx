import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Upload, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/hooks/useProfile";

export const Route = createFileRoute("/documents/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Mes documents — Lexia" },
      {
        name: "description",
        content:
          "Importez vos contrats et rapports puis lancez des analyses IA : résumé, extraction, risques et plan d'action.",
      },
      { property: "og:title", content: "Mes documents — Lexia" },
      { property: "og:description", content: "Vos documents analysés par l'IA Lexia." },
    ],
  }),
  component: DocumentsPage;
});

function DocumentsPage() {
  return null;
}
