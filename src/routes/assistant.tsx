import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { chatAssistant } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";

type Message = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/assistant")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Assistant IA — Lexia" },
      {
        name: "description",
        content:
          "Discutez avec le copilote Lexia : il connaît vos documents et répond avec des recommandations actionnables.",
      },
      { property: "og:title", content: "Assistant IA — Lexia" },
      { property: "og:description", content: "Un copilote IA qui connaît vos documents." },
    ],
  }),
  component: AssistantPage,
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Copy"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function AssistantPage() {
  const send = useServerFn(chatAssistant);
  const { t, tList } = useI18n();
  const suggestions = tList("assistant.suggestions");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [docId, setDocId] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const documents = useQuery({
    queryKey: ["documents", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const thinkingToastId = useRef<string | number>(0);

  const ask = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.slice(-10).map((m) => ({
        ...m,
        content: m.content.slice(-8000),
      }));
      return send({
        data: {
          message,
          documentId: docId === "all" ? null : docId,
          history,
        },
      });
    },
    onSuccess: (result) => {
      toast.dismiss(thinkingToastId.current);
      setMessages((prev) => [...prev, { role: "assistant", content: result.text }]);
    },
    onError: (e: Error) => {
      toast.dismiss(thinkingToastId.current);
      toast.error(e.message || t("assistant.error"));
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  useEffect(() => {
    if (!ask.isPending) inputRef.current?.focus();
  }, [ask.isPending]);

  function submit(text?: string) {
    const clean = (text ?? input).trim();
    if (!clean || ask.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: clean }]);
    setInput("");
    thinkingToastId.current = toast.loading(t("assistant.thinking"));
    ask.mutate(clean);
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("assistant.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("assistant.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessages([]);
                  toast.success(t("assistant.cleared"));
                }}
              >
                <Trash2 className="mr-1.5 size-3.5" /> {t("common.delete")}
              </Button>
            )}
            <Select value={docId} onValueChange={setDocId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t("assistant.context")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("assistant.allDocuments")}</SelectItem>
                {documents.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 && !ask.isPending && (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-8">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                  <Sparkles className="size-5 text-primary-foreground" />
                </span>
                <p className="text-sm text-muted-foreground">{t("assistant.firstQuestion")}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => submit(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[95%] rounded-2xl rounded-bl-sm border border-border/60 bg-surface/60 px-4 py-3"
                  }
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="group relative">
                      <div className="absolute -top-1 right-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <CopyButton text={m.content} />
                      </div>
                      <Markdown content={m.content} />
                    </div>
                  )}
                </div>
              ))}
              {ask.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {t("assistant.thinking")}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder={t("assistant.placeholder")}
            disabled={ask.isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button
            className="h-auto"
            disabled={ask.isPending || !input.trim()}
            onClick={() => submit()}
          >
            {ask.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
