"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logomark } from "@/components/brand/logomark";

interface AuthPageChromeProps {
  titleKey: string;
  subtitleKey: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared background/logo/heading/card shell for the four auth pages
 * (login, register, forgot-password, reset-password). Pulled out into one
 * place so translated copy lives in a single Client Component while the
 * pages themselves stay Server Components (needed for `export const metadata`).
 * Always shows the brand mark — one consistent identity across every
 * entry point into the product, rather than a different icon per page.
 */
export function AuthPageChrome({ titleKey, subtitleKey, footer, children }: AuthPageChromeProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient signal glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
        }}
      />

      {/* Language switcher — top-right corner, available before signing in */}
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logomark size={44} variant="gradient" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              {t(titleKey)}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t(subtitleKey)}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl px-6 py-7"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-dialog)",
          }}
        >
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
