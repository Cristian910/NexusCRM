"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { Logomark } from "@/components/brand/logomark";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="mb-5">
          <Logomark size={48} variant="gradient" />
        </div>

        <p className="text-sm font-semibold tracking-widest" style={{ color: "hsl(var(--primary))" }}>
          404
        </p>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {t("common.notFoundTitle")}
        </h1>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("common.notFoundBody")}
        </p>

        <div className="mt-7 flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              {t("common.backHome")}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard">{t("common.backToDashboard")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
