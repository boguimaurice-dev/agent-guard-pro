import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { createThread, listThreads } from "@/lib/threads.functions";
import { useServerFn } from "@tanstack/react-start";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppIndex,
});

function AppIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const threads = await list();
        if (threads.length > 0) {
          navigate({ to: "/app/$threadId", params: { threadId: threads[0].id } });
        } else {
          const t = await create();
          navigate({ to: "/app/$threadId", params: { threadId: t.id } });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [list, create, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Shield className="h-10 w-10 animate-pulse text-primary" />
        <p className="font-mono text-sm">Initialisation de SECURA AI…</p>
      </div>
    </div>
  );
}
