import { getCurrencySymbol, toDisplayAmount } from "@/lib/currency";
import { isSectionHidden, type PrivacySection } from "@/lib/privacy-preferences";

export const EDITORIAL_PALETTE = [
  "#b85f24", // ember-deep
  "#3d1f0c", // ink
  "#7a8462", // sage
  "#de7b33", // ember
  "#8c6d4f", // warm taupe
  "#c8a27a", // sand
  "#5a3d2b", // espresso
] as const;

/**
 * Formats a stored-currency numeric value for compact chart Y-axis ticks.
 */
export function formatAxisCurrency(value: number, section?: PrivacySection): string {
  if (isSectionHidden(section)) {
    return "••••";
  }
  const converted = toDisplayAmount(value);
  const symbol = getCurrencySymbol();
  const abs = Math.abs(converted);
  const sign = converted < 0 ? "-" : "";

  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}${symbol}${Math.round(abs)}`;
}

/**
 * Returns local YYYY-MM-DD string for a Date without UTC shift.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
