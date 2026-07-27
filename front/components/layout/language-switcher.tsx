"use client";

import React from "react";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent"
          style={{ color: "hsl(var(--muted-foreground))" }}
          aria-label={t("topbar.language")}
        >
          <Globe className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => setLocale(opt.value)} className="justify-between">
            {opt.label}
            {locale === opt.value && <Check className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
