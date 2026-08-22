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
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE, parseFile } from "@/lib/fileParser";
import { useI18n } from "@/lib/i18n";

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
  const [mimeType, setMimeType] = useState("text/plain");
  const { t } = useI18n();

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
      if (clean.length < 40) throw new Error(t("documents.contentTooShort"));
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          title: title.trim() || fileName || "Document sans titre",
          file_name: fileName,
          mime_type: mimeType,
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
      toast.success(t("documents.imported"));
      setOpen(false);
      setTitle("");
      setContent("");
      setFileName(null);
      setMimeType("text/plain");
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
      toast.success(t("documents.deleted"));
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPickFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("documents.fileTooBig"));
      return;
    }
    try {
      const { text, mimeType: mime } = await parseFile(file);
      setFileName(file.name);
      setMimeType(mime);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      setContent(text.slice(0, 60_000));
    } catch {
      toast.error(t("documents.parseError"));
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("documents.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("documents.subtitle")}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 size-4" /> {t("documents.newDocument")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("documents.importDocument")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">{t("documents.titleLabel")}</Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("documents.titlePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-content">{t("documents.contentLabel")}</Label>
                  <Textarea
                    id="doc-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    placeholder={t("documents.contentPlaceholder")}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("documents.words", {
                      count: content.trim().split(/\s+/).filter(Boolean).length,
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onPickFile(file);
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    {t("documents.importFile")}
                  </Button>
                  {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
                  <Button
                    className="ml-auto"
                    disabled={create.isPending}
                    onClick={() => create.mutate()}
                  >
                    {create.isPending ? t("documents.importing") : t("documents.importAndAnalyze")}
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
                      {doc.summary ?? t("documents.noSummary")}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {t("documents.words", { count: doc.word_count })}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("documents.deleteLabel")}
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
              <p className="font-display text-lg font-semibold">{t("documents.emptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t("documents.emptyText")}</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 size-4" /> {t("documents.importFirst")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
