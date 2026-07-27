"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function LoginFooter() {
  const { t } = useTranslation();
  return (
    <p className="mt-5 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
      {t("auth.noWorkspace")}{" "}
      <Link
        href="/register"
        className="font-medium transition-colors"
        style={{ color: "hsl(var(--primary))" }}
      >
        {t("auth.createOneFree")}
      </Link>
    </p>
  );
}
