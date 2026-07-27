"use client";

// Root-level error.tsx replaces the entire root layout (including providers)
// when it's active, so it can't rely on <I18nProvider>'s React context — it
// needs its own <html>/<body> and uses the standalone t() accessor instead,
// which reads from a module-level variable rather than context.
import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { t } from "@/lib/i18n/context";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="font-sans antialiased">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--destructive) / 0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center text-center">
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}
            >
              <AlertTriangle className="h-6 w-6" style={{ color: "hsl(var(--destructive))" }} />
            </div>

            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {t("common.somethingBroke")}
            </h1>
            <p className="mt-2 max-w-sm text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("common.somethingBrokeBody")}
            </p>

            <div className="mt-7 flex items-center gap-3">
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              >
                <Home className="h-3.5 w-3.5" />
                {t("common.backToDashboard")}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {t("common.tryAgain")}
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
