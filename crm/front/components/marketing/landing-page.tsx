"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Users, TrendingUp, CheckSquare, BarChart2, Bell,
  ShieldCheck, ArrowRight, CodeXml, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineVisual } from "./pipeline-visual";
import { KanbanPreview } from "./kanban-preview";

const FEATURES = [
  {
    icon: Users,
    title: "Client records that stay tidy",
    description: "Every contact, company, and note in one searchable place — no more digging through spreadsheets.",
  },
  {
    icon: TrendingUp,
    title: "A pipeline you can drag",
    description: "Move deals through Lead, Contacted, Negotiation, and Won with a Kanban board built for speed.",
  },
  {
    icon: CheckSquare,
    title: "Tasks tied to real work",
    description: "Follow-ups and next steps linked straight to the deal and teammate they belong to.",
  },
  {
    icon: BarChart2,
    title: "Analytics that explain why",
    description: "Win rates, pipeline value, and rep performance — read at a glance, not assembled by hand.",
  },
  {
    icon: Bell,
    title: "Notified, not overwhelmed",
    description: "Real-time alerts when a deal moves, a task is due, or a teammate needs you.",
  },
  {
    icon: ShieldCheck,
    title: "Roles that actually restrict",
    description: "Owner, Admin, Member, Viewer — permissions enforced on every request, not just hidden in the UI.",
  },
];

const STACK = [
  "Next.js 16", "React 19", "TypeScript", "NestJS", "PostgreSQL", "Prisma", "Redis", "BullMQ",
];

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <Nav />
      <Hero />
      <FeatureGrid />
      <ProductGlimpse />
      <TechStrip />
      <CtaBand />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.75)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "hsl(var(--primary))" }}>
            <Zap className="h-4 w-4" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>NexusCRM</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <a href="#features" className="text-sm transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>Features</a>
          <a href="#stack" className="text-sm transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>Stack</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[900px] -translate-x-1/2 opacity-20"
        style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)) 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--card))" }}
        >
          <Layers className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
          Multi-tenant CRM, built for small sales teams
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}
        >
          Your pipeline, finally
          <br />
          somewhere it belongs.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base sm:text-lg"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Clients, deals, tasks, and the numbers that matter — in one place your
          whole team can actually keep up to date.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" className="gap-2 w-full sm:w-auto" asChild>
            <Link href="/register">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
        >
          <PipelineVisual />
        </motion.div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHeading
        eyebrow="Everything, connected"
        title="Built for how sales teams actually work"
        description="No bolted-on modules — clients, deals, tasks, and analytics share the same data model from day one."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
            className="rounded-xl border p-5"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
          >
            <div
              className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              <f.icon className="h-4.5 w-4.5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ProductGlimpse() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="The pipeline view"
            title="See every deal, not just the next one"
            description="Drag a deal from Lead to Won. The board updates instantly for everyone on your team — no refresh, no waiting."
            align="left"
          />
          <ul className="mt-6 space-y-3">
            {[
              "Real-time stage updates across the team",
              "Deal value and win probability per stage",
              "Full audit trail of every stage change",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <KanbanPreview />
        </motion.div>
      </div>
    </section>
  );
}

function TechStrip() {
  return (
    <section id="stack" className="border-y" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p
          className="mb-5 text-center text-xs font-medium uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Built with a modern, production-grade stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border px-3 py-1 font-mono text-xs"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--card))" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "hsl(var(--foreground))" }}>
        Ready to see your pipeline clearly?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm sm:text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
        Create an organization and invite your team — takes less than a minute.
      </p>
      <div className="mt-7">
        <Button size="lg" className="gap-2" asChild>
          <Link href="/register">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "hsl(var(--primary))" }}>
            <Zap className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>NexusCRM</span>
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>· a full-stack portfolio project</span>
        </div>

        {/* TODO: replace with the repo's real URL before deploying */}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <CodeXml className="h-3.5 w-3.5" />
          View source
        </a>
      </div>
    </footer>
  );
}

function SectionHeading({ eyebrow, title, description, align = "center" }: {
  eyebrow: string; title: string; description: string; align?: "center" | "left";
}) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-xl text-center" : "max-w-md"}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>
        {eyebrow}
      </p>
      <h2
        className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
        style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-sm sm:text-base" style={{ color: "hsl(var(--muted-foreground))" }}>
        {description}
      </p>
    </div>
  );
}
