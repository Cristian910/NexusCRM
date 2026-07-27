"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations, type Locale } from "./translations";

type Dict = typeof translations["en"];

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "nexuscrm-locale";

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.split(`{{${k}}}`).join(String(v)),
    str
  );
}

function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const primary = getNested(translations[locale], key);
  const value = typeof primary === "string" ? primary : getNested(translations.en, key);
  // Missing keys fall back to the raw key rather than throwing — visible
  // and easy to spot in review, without ever crashing the page.
  return interpolate(typeof value === "string" ? value : key, vars);
}

// ── Module-level mirror of the current locale ──────────────────────
// React Query mutation hooks (useCreateDeal, useInviteUser, etc.) call
// toast.success(...) outside of any component's render, so they can't call
// useTranslation(). This tiny synced accessor lets them translate too,
// without threading `t` through every mutation's onSuccess callback.
let currentLocale: Locale = "es";
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(currentLocale, key, vars);
}
export function getLocale(): Locale {
  return currentLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      setLocaleState(stored);
      currentLocale = stored;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    currentLocale = l;
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return ctx;
}

/**
 * Zod schemas emit translation keys (e.g. "validation.emailRequired") instead
 * of literal English text, so error messages stay correct when the locale
 * changes. Anything else (e.g. a server-side error message) passes through
 * unchanged. Centralized here so every error-displaying component resolves
 * messages the same way without extra plumbing at each call site.
 */
export function resolveFormMessage(t: (key: string) => string, message?: string): string | undefined {
  if (!message) return message;
  return message.startsWith("validation.") ? t(message) : message;
}
