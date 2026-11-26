function formatWholeCurrencyAmount(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const whole = Math.abs(Math.round(amount)).toString();
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${withCommas}`;
}

export function formatCurrency(amount: number) {
  return formatWholeCurrencyAmount(amount);
}

export function formatCompactCurrency(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);

  if (absolute < 1000) {
    return `${sign}$${Math.round(absolute)}`;
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

  return `${sign}$${compactText}${unit.suffix}`;
}

export function formatPercent(part: number, whole: number) {
  if (whole <= 0) return "0%";

  return `${Math.round((part / whole) * 100)}%`;
}
