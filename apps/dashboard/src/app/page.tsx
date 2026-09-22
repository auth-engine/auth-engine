"use client";

import { Fragment, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Fingerprint,
  Building2,
  KeyRound,
  Server,
  Check,
  X,
  Minus,
  Globe,
  Layers,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContactForm } from "@/components/contact-form";
import { useAuthStore } from "@/stores/auth-store";
import { useIsClient } from "@/hooks/use-is-client";

const DOCS_URL = "https://docs.authengine.org";
const API_DOCS_URL = "https://api.authengine.org/docs";
const OIDC_DISCOVERY_URL =
  "https://api.authengine.org/.well-known/openid-configuration";
const GITHUB_URL = "https://github.com/authengine/authengine";

const PILLARS = [
  {
    badge: "For your users",
    icon: <Fingerprint className="h-7 w-7" />,
    title: "Authentication & Authorization",
    desc: "Every modern way to log in — built in and ready to ship.",
    items: [
      "Email & password login",
      "Passwordless magic links",
      "Passkeys & biometrics (WebAuthn)",
      "Social login — Google, Microsoft, GitHub & more",
      "Multi-factor authentication (TOTP & OTP)",
    ],
  },
  {
    badge: "For your business",
    icon: <Building2 className="h-7 w-7" />,
    title: "Enterprise Multi-Tenancy & Access Control",
    desc: "Run thousands of isolated organizations from one deployment.",
    items: [
      "One account across every organization & service",
      "Dynamic organization / service switching",
      "Hierarchical, extendable role-based access control",
      "Per-tenant isolation — login methods, security policies, branding & more",
    ],
  },
  {
    badge: "For your platform",
    icon: <KeyRound className="h-7 w-7" />,
    title: "AuthEngine as an Identity Provider",
    desc: "A standards-compliant OpenID Connect provider out of the box.",
    items: [
      "OIDC discovery endpoint",
      "JWKS public key publishing",
      "Dynamic client registration",
      "Authorization Code flow with PKCE",
    ],
  },
];

type TypicalStatus = "included" | "addon" | "vendor" | "enterprise" | "no";

const COMPARE: { feature: string; typical: TypicalStatus }[] = [
  { feature: "Email & password login", typical: "included" },
  { feature: "Passwordless magic links", typical: "addon" },
  { feature: "Passkeys & WebAuthn", typical: "addon" },
  { feature: "Email OTP & verification", typical: "vendor" },
  { feature: "SMS / phone OTP", typical: "vendor" },
  { feature: "Social login (Google, GitHub…)", typical: "included" },
  { feature: "Multi-factor auth (TOTP)", typical: "addon" },
  { feature: "Multi-tenancy & RBAC", typical: "enterprise" },
  { feature: "OpenID Connect provider", typical: "enterprise" },
  { feature: "Audit logs & session control", typical: "enterprise" },
  { feature: "Your own domain & data", typical: "no" },
  { feature: "Flat, no per-user pricing", typical: "no" },
];

const TYPICAL_META: Record<TypicalStatus, { label: string; cls: string }> = {
  included: { label: "Included", cls: "text-emerald-600" },
  addon: { label: "Paid add-on", cls: "text-amber-600" },
  vendor: { label: "Separate vendor", cls: "text-amber-600" },
  enterprise: { label: "Enterprise tier", cls: "text-amber-600" },
  no: { label: "Not available", cls: "text-destructive/80" },
};

function TypicalCell({ status }: { status: TypicalStatus }) {
  const meta = TYPICAL_META[status];
  const Icon = status === "included" ? Check : status === "no" ? X : Minus;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.cls}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{meta.label}</span>
    </span>
  );
}

export default function Home() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const isClient = useIsClient();

  useEffect(() => {
    if (accessToken) {
      router.push("/me");
    }
  }, [accessToken, router]);

  if (!isClient || accessToken) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 px-4 lg:px-8 h-20 flex items-center border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center gap-2.5 group" href="/">
            <span className="inline-flex items-center justify-center rounded-xl p-1 transition-transform group-hover:scale-105 dark:bg-white/95">
              <Image
                src="/squarelogo.png"
                alt="AuthEngine"
                width={500}
                height={500}
                priority
                className="h-9 w-9"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-extrabold text-xl tracking-tight">AuthEngine</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                One identity for every app
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#features"
              className="hidden md:inline text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <ThemeToggle />
            <Button asChild size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20">
              <Link href="/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative w-full pt-6 pb-16 md:pt-10 md:pb-24 lg:pt-12 lg:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,var(--primary)_0%,transparent_50%)] opacity-[0.08]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full -z-10" />

          <div className="container px-4 md:px-6 mx-auto relative">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="rounded-3xl bg-white p-4 shadow-xl shadow-primary/10 ring-1 ring-border/50 animate-in fade-in zoom-in-95 duration-1000">
                <Image
                  src="/squarelogo.png"
                  alt="AuthEngine"
                  width={500}
                  height={500}
                  priority
                  className="h-20 w-20"
                />
              </div>
              <div className="space-y-4 max-w-4xl mx-auto">
                <Badge
                  variant="outline"
                  className="py-1 px-4 text-xs font-bold tracking-widest uppercase border-primary/20 bg-primary/5 text-primary animate-in fade-in slide-in-from-top-4 duration-1000"
                >
                  The self-hosted Auth0 alternative
                </Badge>
                <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  Auth that does{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-gradient">
                    it all. Hosted by you.
                  </span>
                </h1>
                <p className="mx-auto max-w-[820px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed font-medium animate-in fade-in duration-1000 delay-300">
                  Email, passwordless, passkeys, social and MFA. Multi-tenant access
                  control. A full OpenID Connect provider. The complete identity
                  platform you run on your own domain — without per-user pricing.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 animate-in fade-in duration-1000 delay-500">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25 group transition-all hover:scale-105 active:scale-95"
                >
                  <Link href="/register">
                    Get Started{" "}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 rounded-2xl text-lg font-bold border-muted-foreground/20 hover:bg-muted/50 transition-all"
                >
                  <a href="#contact">Talk to us</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section id="features" className="w-full py-24 border-t border-border/40 relative scroll-mt-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-2xl mb-16 text-center mx-auto">
              <Badge
                variant="outline"
                className="py-1 px-4 mb-4 text-xs font-bold tracking-widest uppercase border-primary/20 bg-primary/5 text-primary"
              >
                Features
              </Badge>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Three platforms in one engine
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Authentication for your users, access control for your business, and a
                full identity provider for your platform.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {PILLARS.map((p, i) => (
                <div
                  key={i}
                  className="group flex flex-col p-8 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/50 transition-all duration-500"
                >
                  <div className="mb-5 inline-flex w-fit p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {p.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                    {p.badge}
                  </span>
                  <h3 className="text-2xl font-bold mt-1 mb-2">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{p.desc}</p>
                  <ul className="space-y-3 mt-auto">
                    {p.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm font-medium">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why it's different — all in one pack */}
        <section className="w-full py-24 border-t border-border/40 bg-muted/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-2xl mb-16 text-center mx-auto">
              <Badge
                variant="outline"
                className="py-1 px-4 mb-4 text-xs font-bold tracking-widest uppercase border-primary/20 bg-primary/5 text-primary"
              >
                Why AuthEngine
              </Badge>
              <h2 className="font-black tracking-tight whitespace-nowrap text-[clamp(1.05rem,5vw,3rem)]">
                One Platform for All Your Auth Needs.
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Most teams bolt together an OTP service, an SMS gateway, a social-login
                SaaS and an MFA add-on. AuthEngine replaces the whole stack.
              </p>
            </div>

            {/* Capability comparison table */}
            <div className="max-w-4xl mx-auto rounded-3xl border border-border/50 bg-card/40 overflow-hidden shadow-xl shadow-primary/5">
              <div className="grid grid-cols-[1.4fr_1fr_1fr]">
                {/* Header row */}
                <div className="p-4 sm:p-5 bg-muted/40 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Capability
                </div>
                <div className="p-4 sm:p-5 bg-muted/40 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Typical stack
                </div>
                <div className="p-4 sm:p-5 bg-primary/10 text-center text-xs font-bold uppercase tracking-widest text-primary">
                  AuthEngine
                </div>

                {COMPARE.map((row, i) => (
                  <Fragment key={row.feature}>
                    <div className={`p-4 sm:p-5 border-t border-border/40 text-sm font-medium ${i % 2 ? "bg-muted/10" : ""}`}>
                      {row.feature}
                    </div>
                    <div className={`p-4 sm:p-5 border-t border-border/40 flex items-center justify-center ${i % 2 ? "bg-muted/10" : ""}`}>
                      <TypicalCell status={row.typical} />
                    </div>
                    <div className="p-4 sm:p-5 border-t border-border/40 flex items-center justify-center bg-primary/[0.05]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Check className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Included</span>
                      </span>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
              Every capability ships in a single self-hosted deployment — no add-ons,
              no extra vendors, no per-user pricing.
            </p>

            {/* Quick stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-16">
              {[
                { icon: <Layers className="h-6 w-6" />, label: "7+ auth methods", sub: "in a single API" },
                { icon: <Server className="h-6 w-6" />, label: "Self-hosted", sub: "your infra, your data" },
                { icon: <Globe className="h-6 w-6" />, label: "Your domain", sub: "fully white-labelled" },
                { icon: <KeyRound className="h-6 w-6" />, label: "OIDC provider", sub: "standards-based" },
              ].map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl border border-border/50 bg-card/30">
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-3">
                    {s.icon}
                  </div>
                  <p className="font-bold text-lg">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / integration */}
        <section id="contact" className="w-full py-24 border-t border-border/40 scroll-mt-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start max-w-6xl mx-auto">
              <div className="lg:sticky lg:top-28">
                <Badge
                  variant="outline"
                  className="py-1 px-4 mb-4 text-xs font-bold tracking-widest uppercase border-primary/20 bg-primary/5 text-primary"
                >
                  Get in touch
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                  Looking to integrate? Let&apos;s talk.
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Tell us what you&apos;re building and our team will help you scope the
                  integration, plan a migration, or stand up a self-hosted deployment.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Hands-on integration & migration help",
                    "Architecture review for multi-tenant setups",
                    "Self-hosting, scaling & security guidance",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 font-medium">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-border/50 bg-card/40 p-6 sm:p-8 shadow-xl shadow-primary/5">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Big logo band */}
        <section className="w-full py-24 border-t border-border/40 bg-muted/20">
          <div className="container px-4 mx-auto flex flex-col items-center text-center gap-6">
            <div className="rounded-3xl p-6 sm:p-10 dark:bg-white/95">
              <Image
                src="/reactanglelogo.png"
                alt="AuthEngine — one identity for every app"
                width={707}
                height={353}
                className="h-24 sm:h-32 md:h-40 w-auto"
              />
            </div>
            <p className="text-lg font-semibold tracking-wide text-muted-foreground">
              One identity for every app.
            </p>
            <Button asChild size="lg" className="h-14 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-primary/25">
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-muted/10">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 w-fit">
                <span className="inline-flex items-center justify-center rounded-xl p-1 dark:bg-white/95">
                  <Image src="/squarelogo.png" alt="AuthEngine" width={500} height={500} className="h-9 w-9" />
                </span>
                <span className="font-extrabold text-xl tracking-tight">AuthEngine</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                The open-source, self-hosted identity platform. One identity for every app.
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" /> Star us on GitHub
              </a>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
                <li><Link className="hover:text-primary transition-colors" href="/register">Get Started</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/login">Sign In</Link></li>
                <li><a className="hover:text-primary transition-colors" href="#contact">Contact Sales</a></li>
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Developers</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a className="hover:text-primary transition-colors" href={DOCS_URL} target="_blank" rel="noopener noreferrer">Documentation</a></li>
                <li><a className="hover:text-primary transition-colors" href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">API Reference</a></li>
                <li><a className="hover:text-primary transition-colors" href={OIDC_DISCOVERY_URL} target="_blank" rel="noopener noreferrer">OIDC Discovery</a></li>
                <li><a className="hover:text-primary transition-colors" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="/terms">Terms &amp; Conditions</Link></li>
                <li><a className="hover:text-primary transition-colors" href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">License</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 AuthEngine. Open-source software, released under the MIT License.
            </p>
            <nav className="flex flex-wrap justify-center gap-6 text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <Link className="hover:text-primary transition-colors" href="/privacy">Privacy</Link>
              <Link className="hover:text-primary transition-colors" href="/terms">Terms</Link>
              <a className="hover:text-primary transition-colors" href="#contact">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
