"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { translations } from "@/lib/i18n/translations";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface LegalPageProps {
  titleKey: "legal.termsTitle" | "legal.privacyTitle";
  updatedKey: "legal.termsUpdated" | "legal.privacyUpdated";
  introKey: "legal.termsIntro" | "legal.privacyIntro";
  sections: "termsSections" | "privacySections";
}

export function LegalPage({ titleKey, updatedKey, introKey, sections }: LegalPageProps) {
  const { t, locale } = useTranslation();
  const items = translations[locale].legal[sections];

  return (
    <div className="relative min-h-screen bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/register"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("legal.backToRegister")}
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          {t(titleKey)}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {t(updatedKey)}
        </p>

        <p className="mt-6 text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
          {t(introKey)}
        </p>

        <div className="mt-8 space-y-6">
          {items.map((section) => (
            <div key={section.heading}>
              <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                {section.heading}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
