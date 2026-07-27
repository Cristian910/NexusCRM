"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function RegisterFooter() {
  const { t } = useTranslation();
  return (
    <p className="mt-5 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
      {t("auth.alreadyHaveWorkspace")}{" "}
      <Link
        href="/login"
        className="font-medium transition-colors"
        style={{ color: "hsl(var(--primary))" }}
      >
        {t("auth.signIn")}
      </Link>
    </p>
  );
}
