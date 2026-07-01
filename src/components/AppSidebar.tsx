import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread, deleteThread, renameThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, MessageSquare, Trash2, LogOut, Shield, Pencil, Check, X, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/secura-logo.png";
import { cn } from "@/lib/utils";

type Thread = { id: string; title: string; updated_at: string; created_at: string };

function SidebarBody({ refreshKey, onNavigate }: { refreshKey?: number; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const rename = useServerFn(renameThread);

  const reload = async () => {
    try {
      setThreads(await list());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleNew = async () => {
    try {
      const t = await create();
      await reload();
      onNavigate?.();
      navigate({ to: "/app/$threadId", params: { threadId: t.id } });
    } catch (e) {
      toast.error("Impossible de créer l'audit");
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer cet audit ?")) return;
    try {
      await del({ data: { id } });
      const remaining = threads.filter((t) => t.id !== id);
      setThreads(remaining);
      if (params.threadId === id) {
        if (remaining[0]) navigate({ to: "/app/$threadId", params: { threadId: remaining[0].id } });
        else navigate({ to: "/" });
      }
    } catch (err) {
      toast.error("Suppression impossible");
      console.error(err);
    }
  };

  const startEdit = (t: Thread, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(t.id);
    setEditValue(t.title);
  };

  const commitEdit = async (id: string) => {
    const title = editValue.trim();
    if (!title) return setEditingId(null);
    try {
      await rename({ data: { id, title } });
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    } catch {
      toast.error("Renommage impossible");
    }
    setEditingId(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <img src={logo} alt="SECURA AI" className="h-9 w-9 rounded-lg" />
        <div>
          <div className="font-display text-sm font-bold tracking-wider text-gradient-cyber">SECURA AI</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Web &amp; API Security</div>
        </div>
      </div>

      <div className="p-3">
        <Button onClick={handleNew} className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Nouvel audit
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="p-3 text-xs text-muted-foreground">Chargement…</div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Aucun audit encore.</div>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => {
              const active = params.threadId === t.id;
              const editing = editingId === t.id;
              return (
                <li key={t.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-2 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-primary/40"
                        : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    {editing ? (
                      <>
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(t.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-7 flex-1 bg-background/50 text-xs"
                        />
                        <button type="button" onClick={() => commitEdit(t.id)} className="text-primary" aria-label="Valider">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-muted-foreground" aria-label="Annuler">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/app/$threadId"
                          params={{ threadId: t.id }}
                          onClick={onNavigate}
                          className="flex flex-1 items-center gap-2 truncate"
                        >
                          <MessageSquare className="h-4 w-4 shrink-0 text-primary/80" />
                          <span className="truncate">{t.title}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => startEdit(t, e)}
                          className="opacity-0 transition group-hover:opacity-100 hover:text-primary"
                          aria-label="Renommer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(t.id, e)}
                          className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span className="truncate">{email}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar({ refreshKey }: { refreshKey?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile trigger */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Ouvrir le menu" className="h-9 w-9 bg-background/80 backdrop-blur">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarBody refreshKey={refreshKey} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop */}
      <aside className="hidden md:flex h-screen w-72 shrink-0 flex-col border-r border-border">
        <SidebarBody refreshKey={refreshKey} />
      </aside>
    </>
  );
}
