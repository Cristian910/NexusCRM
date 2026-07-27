"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-5 px-4 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "hsl(var(--destructive) / 0.1)" }}
      >
        <AlertTriangle className="h-6 w-6" style={{ color: "hsl(var(--destructive))" }} />
      </div>
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {t("common.somethingBroke")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t("common.somethingBrokeBody")}
        </p>
      </div>
      <Button size="sm" className="gap-1.5" onClick={reset}>
        <RotateCw className="h-3.5 w-3.5" />
        {t("common.tryAgain")}
      </Button>
    </div>
  );
}
