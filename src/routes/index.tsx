import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Search, Bug, FileText, ArrowRight, Lock, Terminal } from "lucide-react";
import logo from "@/assets/secura-logo.png";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SECURA AI — Agent IA d'audit & sécurité Web / API" },
      {
        name: "description",
        content:
          "SECURA AI est votre agent IA spécialisé en cybersécurité web, audit d'applications et API security. Basé sur OWASP Top 10 et les labs PortSwigger.",
      },
      { property: "og:title", content: "SECURA AI — Agent IA d'audit & sécurité Web / API" },
      {
        property: "og:description",
        content: "Audit, détection et remédiation des vulnérabilités OWASP / API en conversation avec un agent IA expert.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const cta = signedIn ? "Ouvrir la console" : "Commencer un audit";
  const ctaHref = signedIn ? "/" : "/auth";

  const goConsole = () => {
    if (signedIn) navigate({ to: "/" });
    else navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-60" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--gradient-shield)" }}
      />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SECURA AI" className="h-10 w-10 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-wider text-gradient-cyber">SECURA AI</span>
        </div>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button onClick={goConsole} variant="outline" size="sm">
              Ouvrir la console
            </Button>
          ) : (
            <>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                Connexion
              </Link>
              <Button onClick={goConsole} size="sm" className="bg-gradient-cyber text-primary-foreground shadow-glow">
                Démarrer
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-14 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary">
          <Lock className="h-3 w-3" /> OWASP • PortSwigger • API Security
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          <span className="text-gradient-cyber">Protégez vos APIs</span>
          <br />
          <span className="text-foreground">avant qu'il ne soit trop tard.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          SECURA AI est votre agent IA d'audit sécurité. Pentester, auditeur, formateur et rédacteur de rapports — dans une
          seule conversation.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            onClick={goConsole}
            size="lg"
            className="bg-gradient-cyber text-primary-foreground shadow-glow hover:opacity-90"
          >
            {cta} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a
            href="https://owasp.org/www-project-top-ten/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button size="lg" variant="outline">
              <FileText className="mr-2 h-4 w-4" /> OWASP Top 10
            </Button>
          </a>
        </div>
      </header>

      {/* Feature strip */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Search, label: "AUDIT", desc: "Recon, endpoints, params, auth" },
            { icon: Shield, label: "PROTECT", desc: "Bonnes pratiques défensives" },
            { icon: Bug, label: "DÉTECTER", desc: "OWASP Top 10, API Top 10" },
            { icon: Terminal, label: "SÉCURISER", desc: "PoC, payloads, remédiation" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="panel rounded-xl p-4 text-center">
              <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-display text-sm font-bold tracking-widest text-gradient-cyber">{label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What it does */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Analyse de requêtes",
              d: "Colle une requête HTTP : SECURA AI liste les failles probables, tests et payloads concrets.",
            },
            {
              t: "Méthodologie OWASP",
              d: "Auth, IDOR/BOLA, injections, mass assignment, exposition de données — appliqué systématiquement.",
            },
            {
              t: "Rapports d'audit",
              d: "Nom, description, impact, PoC, preuve, recommandation — au format pro.",
            },
            {
              t: "Mode entraînement",
              d: "Missions guidées avec indices progressifs, alignées sur les labs PortSwigger.",
            },
            {
              t: "Analyse de code",
              d: "Repère les patterns vulnérables et propose la fix (validation, encoding, authz).",
            },
            {
              t: "Fuites de secrets",
              d: "Interprétation des sorties Gitleaks / trufflehog et remédiation.",
            },
          ].map((c) => (
            <div key={c.t} className="panel rounded-xl p-5">
              <div className="mb-2 font-display text-base font-semibold text-foreground">{c.t}</div>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        <a href={ctaHref}>SECURA AI</a> — votre agent de sécurité Web &amp; API. Utilisation éthique uniquement.
      </footer>
    </div>
  );
}
