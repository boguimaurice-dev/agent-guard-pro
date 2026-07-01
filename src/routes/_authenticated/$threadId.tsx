import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { UIMessage } from "ai";
import { getThreadMessages } from "@/lib/threads.functions";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const fetchMessages = useServerFn(getThreadMessages);
  const [messages, setMessages] = useState<UIMessage[] | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setMessages(null);
    fetchMessages({ data: { threadId } })
      .then((res) => {
        if (!alive) return;
        setMessages(
          (res.messages as unknown as Array<{ id: string; role: string; parts: unknown }>).map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant" | "system",
            parts: m.parts as UIMessage["parts"],
          })),
        );
        setSidebarKey((k) => k + 1);
      })
      .catch((e) => {
        console.error(e);
        navigate({ to: "/" });
      });
    return () => {
      alive = false;
    };
  }, [threadId, fetchMessages, navigate]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar refreshKey={sidebarKey} />
      {messages === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ChatWindow key={threadId} threadId={threadId} initialMessages={messages} />
      )}
    </div>
  );
}
