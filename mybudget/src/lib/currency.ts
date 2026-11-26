export type CurrencyCode = "USD" | "PHP";

export type CurrencySettings = {
  code: CurrencyCode;
  usdToPhp: number;
};

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  code: "USD",
  usdToPhp: 56,
};

export const CURRENCY_SETTINGS_EVENT = "mybudget-currency-change";

export function getCurrencySettings(): CurrencySettings {
  if (typeof window === "undefined") return DEFAULT_CURRENCY_SETTINGS;

  const code = window.localStorage.getItem("mybudget-currency") === "PHP" ? "PHP" : "USD";
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

function toDisplayAmount(amount: number) {
  const settings = getCurrencySettings();
  return settings.code === "PHP" ? amount * settings.usdToPhp : amount;
}

function formatWholeCurrencyAmount(amount: number) {
  const settings = getCurrencySettings();
  const displayAmount = toDisplayAmount(amount);
  const sign = displayAmount < 0 ? "-" : "";
  const symbol = settings.code === "PHP" ? "₱" : "$";
  const whole = Math.abs(Math.round(displayAmount)).toString();
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${symbol}${withCommas}`;
}

export function formatCurrency(amount: number) {
  return formatWholeCurrencyAmount(amount);
}

export function formatCompactCurrency(amount: number) {
  const settings = getCurrencySettings();
  const convertedAmount = toDisplayAmount(amount);
  const sign = convertedAmount < 0 ? "-" : "";
  const symbol = settings.code === "PHP" ? "₱" : "$";
  const absolute = Math.abs(convertedAmount);

  if (absolute < 1000) {
    return `${sign}${symbol}${Math.round(absolute)}`;
  }

  const units = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => absolute >= candidate.value) ?? units[units.length - 1];
  const compact = Math.round((absolute / unit.value) * 10) / 10;
  const compactText = Number.isInteger(compact)
    ? compact.toString()
    : compact.toFixed(1);

  return `${sign}${symbol}${compactText}${unit.suffix}`;
}

export function formatPercent(part: number, whole: number) {
  if (whole <= 0) return "0%";

  return `${Math.round((part / whole) * 100)}%`;
}

export function getCurrencySymbol() {
  return getCurrencySettings().code === "PHP" ? "₱" : "$";
}

export function toStoredUsd(amount: number) {
  const settings = getCurrencySettings();
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return settings.code === "PHP" ? amount / settings.usdToPhp : amount;
}
