import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { getLocale } from "@/lib/i18n/context";

const DATE_FNS_LOCALES = { en: enUS, es } as const;
const INTL_LOCALES = { en: "en-US", es: "es" } as const;

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: DATE_FNS_LOCALES[getLocale()] });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: DATE_FNS_LOCALES[getLocale()] });
}

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale?: string
): string {
  return new Intl.NumberFormat(locale ?? INTL_LOCALES[getLocale()], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(INTL_LOCALES[getLocale()], { notation: "compact" }).format(n);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
