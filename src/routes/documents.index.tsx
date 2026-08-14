import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

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
  component: DocumentsPage,
});

function DocumentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const documents = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, file_name, word_count, summary, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Session expirée.");
      const clean = content.trim();
      if (clean.length < 40) throw new Error("Le contenu doit contenir au moins 40 caractères.");
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          title: title.trim() || fileName || "Document sans titre",
          file_name: fileName,
          mime_type: "text/plain",
          size_bytes: new TextEncoder().encode(clean).length,
          content: clean,
          word_count: clean.split(/\s+/).filter(Boolean).length,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Document importé");
      setOpen(false);
      setTitle("");
      setContent("");
      setFileName(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate({ to: "/documents/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document supprimé");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPickFile(file: File) {
    if (file.size > 1_500_000) {
      toast.error("Fichier trop volumineux (max 1,5 Mo de texte).");
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    setContent(text.slice(0, 60_000));
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Mes documents</h1>
            <p className="mt-2 text-muted-foreground">
              Importez un texte ou un fichier, puis lancez les analyses IA.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 size-4" /> Nouveau document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importer un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">Titre</Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contrat de prestation — Acme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-content">Contenu</Label>
                  <Textarea
                    id="doc-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    placeholder="Collez ici le texte du contrat, rapport ou dossier à analyser…"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.trim().split(/\s+/).filter(Boolean).length} mots
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.csv,.json,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onPickFile(file);
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    Charger un fichier texte
                  </Button>
                  {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
                  <Button
                    className="ml-auto"
                    disabled={create.isPending}
                    onClick={() => create.mutate()}
                  >
                    {create.isPending ? "Import…" : "Importer et analyser"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {documents.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : documents.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.data.map((doc) => (
              <Card key={doc.id} className="group transition-transform hover:-translate-y-0.5">
                <CardContent className="flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <FileText className="size-5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      to="/documents/$id"
                      params={{ id: doc.id }}
                      className="font-display font-semibold hover:text-primary"
                    >
                      {doc.title}
                    </Link>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {doc.summary ?? "Aucune analyse pour le moment."}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {doc.word_count} mots
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer"
                    onClick={() => remove.mutate(doc.id)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="font-display text-lg font-semibold">Aucun document</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Importez votre premier contrat ou rapport pour découvrir les analyses IA de Lexia.
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 size-4" /> Importer un document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
