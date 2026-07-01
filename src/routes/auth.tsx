import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Lock } from "lucide-react";
import logo from "@/assets/secura-logo.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — SECURA AI" },
      { name: "description", content: "Connectez-vous à SECURA AI, votre agent IA d'audit et de sécurité web & API." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/app" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé. Vous pouvez maintenant vous connecter.");
  };

  const forgotPassword = async () => {
    if (!email) return toast.error("Entrez votre email d'abord");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Email de réinitialisation envoyé");
  };

  const signInGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (res.error) return toast.error(String(res.error));
    if (res.redirected) return;
    navigate({ to: "/app" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 grid-bg">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-shield)" }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logo} alt="SECURA AI" className="h-24 w-24 rounded-2xl shadow-glow" />
          <h1 className="font-display text-3xl font-bold tracking-tight text-gradient-cyber">SECURA AI</h1>
          <p className="text-sm text-muted-foreground">Votre agent de sécurité Web &amp; API</p>
        </div>

        <Card className="panel p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="mb-5 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="analyste@exemple.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
                  <Lock className="mr-2 h-4 w-4" /> Se connecter
                </Button>
                <button type="button" onClick={forgotPassword} className="w-full text-center text-xs text-muted-foreground hover:text-primary">
                  Mot de passe oublié ?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Mot de passe</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90">
                  <Shield className="mr-2 h-4 w-4" /> Créer le compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" onClick={signInGoogle} disabled={loading} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.44-1.7 4.22-5.35 4.22-3.22 0-5.85-2.66-5.85-5.94S8.78 6.63 12 6.63c1.83 0 3.06.78 3.77 1.45l2.57-2.47C16.72 4.13 14.55 3.2 12 3.2 6.98 3.2 2.9 7.27 2.9 12.28c0 5.02 4.08 9.08 9.1 9.08 5.25 0 8.72-3.69 8.72-8.88 0-.6-.07-1.06-.16-1.5z"/></svg>
            Continuer avec Google
          </Button>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En vous connectant vous acceptez d'utiliser SECURA AI de manière éthique et uniquement sur des cibles autorisées.
        </p>
      </div>
    </div>
  );
}
