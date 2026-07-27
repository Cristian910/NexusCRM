"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function RegisterLegalNotice() {
  const { t } = useTranslation();
  return (
    <p className="mt-3 text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
      {t("auth.byCreatingAgree")}{" "}
      <Link href="/terms" className="underline underline-offset-2 hover:no-underline">
        {t("auth.terms")}
      </Link>{" "}
      {t("auth.and")}{" "}
      <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
        {t("auth.privacyPolicy")}
      </Link>
      .
    </p>
  );
}
