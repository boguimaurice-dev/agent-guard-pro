import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Shield, CheckCircle2, LogIn } from "lucide-react";
import logo from "@/assets/secura-logo.png";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — SECURA AI" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre compte SECURA AI." },
      { property: "og:title", content: "Réinitialiser votre mot de passe SECURA AI" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe pour votre console d'audit SECURA AI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://agent-web-security.lovable.app/reset-password" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://agent-web-security.lovable.app/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("6 caractères minimum");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour");
    setDone(true);
  };

  const reconnect = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 grid-bg">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-shield)" }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logo} alt="SECURA AI" className="h-20 w-20 rounded-2xl shadow-glow" />
          <h1 className="font-display text-2xl font-bold text-gradient-cyber">
            {done ? "Mot de passe mis à jour" : "Nouveau mot de passe"}
          </h1>
        </div>
        <Card className="panel p-6">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                Votre mot de passe a bien été réinitialisé. Reconnectez-vous pour accéder à SECURA AI.
              </p>
              <Button onClick={reconnect} className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
                <LogIn className="mr-2 h-4 w-4" /> Se reconnecter
              </Button>
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
              <Shield className="h-6 w-6 animate-pulse text-primary" />
              Ouvrez le lien reçu par email pour continuer.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">Nouveau mot de passe</Label>
                <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw2">Confirmer</Label>
                <Input id="pw2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
                <KeyRound className="mr-2 h-4 w-4" /> Mettre à jour
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

