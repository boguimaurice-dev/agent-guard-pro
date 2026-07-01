import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Shield, Loader2, User } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import logo from "@/assets/secura-logo.png";

const SUGGESTIONS = [
  "Audit ce endpoint : GET /api/users/42 (JWT bearer)",
  "Explique la faille IDOR avec un exemple concret",
  "Entraîne-moi sur une injection SQL basique (lab)",
  "Analyse cette requête HTTP et propose des tests",
];

export function ChatWindow({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
}) {
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session?.access_token) {
            headers.set("Authorization", `Bearer ${data.session.access_token}`);
          }
          return fetch(url, { ...init, headers });
        },
        prepareSendMessagesRequest: ({ messages, id, body }) => ({
          body: { messages, threadId: id, ...body },
        }),
      }),
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error(err);
      toast.error("Erreur pendant la génération");
    },
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    if (status === "ready") inputRef.current?.focus();
  }, [status]);

  const submit = async (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-screen flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border/70 bg-background/60 px-6 py-3 backdrop-blur">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <div className="font-display text-sm font-semibold tracking-wide">Console d'audit</div>
          <div className="text-[11px] text-muted-foreground">OWASP Top 10 • PortSwigger • API Security</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {empty ? (
            <div className="mt-8 flex flex-col items-center text-center">
              <img src={logo} alt="" className="mb-4 h-24 w-24 rounded-2xl shadow-glow" />
              <h2 className="mb-1 font-display text-2xl font-bold text-gradient-cyber">Prêt à auditer</h2>
              <p className="mb-8 max-w-lg text-sm text-muted-foreground">
                Posez une question, collez une requête HTTP, ou demandez un audit. SECURA AI applique la méthodologie OWASP et
                les techniques PortSwigger.
              </p>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="panel rounded-lg px-4 py-3 text-left text-sm text-muted-foreground transition hover:text-foreground hover:ring-1 hover:ring-primary/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-cyber shadow-glow">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={
                        isUser
                          ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-cyber px-4 py-2.5 text-primary-foreground shadow-glow"
                          : "max-w-[92%] panel rounded-2xl rounded-tl-sm px-5 py-3"
                      }
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap text-sm">{text}</div>
                      ) : (
                        <Markdown content={text || "…"} />
                      )}
                    </div>
                    {isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
              {status === "submitted" && (
                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-cyber shadow-glow">
                    <Shield className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="panel rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background/60 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Colle une requête HTTP, demande un audit, un payload, une explication…"
            className="min-h-[52px] max-h-40 resize-none bg-input/60 font-mono text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-[52px] bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-[11px] text-muted-foreground">
          ⚠️ Tests uniquement sur des cibles autorisées. Utilisez PortSwigger Academy / DVWA / Juice Shop pour l'entraînement.
        </p>
      </form>
    </div>
  );
}
