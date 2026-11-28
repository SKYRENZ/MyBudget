import { isSectionHidden, MASKED_AMOUNT, type PrivacySection } from "@/lib/privacy-preferences";

export type CurrencyCode = "USD" | "PHP";

export type CurrencySettings = {
  code: CurrencyCode;
  usdToPhp: number;
};

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  code: "PHP",
  usdToPhp: 56,
};

export const CURRENCY_SETTINGS_EVENT = "mybudget-currency-change";

export function getCurrencySettings(): CurrencySettings {
  if (typeof window === "undefined") return DEFAULT_CURRENCY_SETTINGS;

  const code = window.localStorage.getItem("mybudget-currency") === "USD" ? "USD" : "PHP";
  const savedRate = Number(window.localStorage.getItem("mybudget-usd-to-php"));

  return {
    code,
    usdToPhp: Number.isFinite(savedRate) && savedRate > 0
      ? savedRate
      : DEFAULT_CURRENCY_SETTINGS.usdToPhp,
  };
}

export function subscribeCurrencySettings(callback: () => void) {
  window.addEventListener(CURRENCY_SETTINGS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CURRENCY_SETTINGS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getCurrencySnapshot() {
  const settings = getCurrencySettings();
  return `${settings.code}:${settings.usdToPhp}`;
}

export function getServerCurrencySnapshot() {
  return `${DEFAULT_CURRENCY_SETTINGS.code}:${DEFAULT_CURRENCY_SETTINGS.usdToPhp}`;
}

export function updateCurrencySettings(settings: CurrencySettings) {
  if (typeof window === "undefined") return;
  const rate = Number(settings.usdToPhp);

  window.localStorage.setItem("mybudget-currency", settings.code);
  window.localStorage.setItem(
    "mybudget-usd-to-php",
    String(Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_CURRENCY_SETTINGS.usdToPhp),
  );
  window.dispatchEvent(new Event(CURRENCY_SETTINGS_EVENT));
}

export function toDisplayAmount(amount: number) {
  const settings = getCurrencySettings();
  if (!Number.isFinite(amount)) return 0;
  return settings.code === "USD" ? amount / settings.usdToPhp : amount;
}

export function toStoredCurrency(amount: number) {
  const settings = getCurrencySettings();
  if (!Number.isFinite(amount)) return 0;
  return settings.code === "USD" ? amount * settings.usdToPhp : amount;
}

export const toStoredUsd = toStoredCurrency;

function formatDecimalAmount(amount: number, fractionDigits = 2) {
  const fixed = Math.abs(amount).toFixed(fractionDigits);
  const [whole, decimal] = fixed.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal ? `${withCommas}.${decimal}` : withCommas;
}

function formatDecimalCurrencyAmount(amount: number) {
  const settings = getCurrencySettings();
  const displayAmount = toDisplayAmount(amount);
  const sign = displayAmount < 0 ? "-" : "";
  const symbol = settings.code === "USD" ? "$" : "₱";
  return `${sign}${symbol}${formatDecimalAmount(displayAmount, 2)}`;
}

export function formatCurrency(amount: number, section?: PrivacySection) {
  if (isSectionHidden(section)) {
    return `${getCurrencySymbol()}${MASKED_AMOUNT}`;
  }
  return formatDecimalCurrencyAmount(amount);
}

export function formatCompactCurrency(amount: number, section?: PrivacySection) {
  if (isSectionHidden(section)) {
    return `${getCurrencySymbol()}${MASKED_AMOUNT}`;
  }
  const settings = getCurrencySettings();
  const convertedAmount = toDisplayAmount(amount);
  const sign = convertedAmount < 0 ? "-" : "";
  const symbol = settings.code === "USD" ? "$" : "₱";
  const absolute = Math.abs(convertedAmount);

  if (absolute < 1000) {
    return `${sign}${symbol}${formatDecimalAmount(absolute, 2)}`;
  }

  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => absolute >= candidate.value) ?? units[units.length - 1];
  const compactText = (absolute / unit.value).toFixed(2);

  return `${sign}${symbol}${compactText}${unit.suffix}`;
}

export function formatPercent(part: number, whole: number) {
  if (whole <= 0) return "0%";

  return `${Number(((part / whole) * 100).toFixed(2))}%`;
}

export function getCurrencySymbol() {
  return getCurrencySettings().code === "USD" ? "$" : "₱";
}
