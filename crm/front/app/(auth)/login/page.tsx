import { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(221.2 83.2% 53.3% / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Zap className="h-5 w-5" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              Welcome back
            </h1>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Sign in to your NexusCRM workspace
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl px-6 py-7"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 0 0 1px hsl(var(--border)), 0 8px 24px -4px hsl(0 0% 0% / 0.2)",
          }}
        >
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Don&apos;t have a workspace?{" "}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: "hsl(var(--primary))" }}
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
