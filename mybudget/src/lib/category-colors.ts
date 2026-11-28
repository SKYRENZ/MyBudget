export type CategoryColorPreset = {
  name: string;
  hex: string;
};

export const DEFAULT_CATEGORY_COLOR = "#D97706";

// Muted, editorial palette aligned with MyBudget's Financial Times-inspired aesthetic
export const CATEGORY_COLOR_PRESETS: CategoryColorPreset[] = [
  { name: "Orange", hex: "#D97706" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Green", hex: "#166534" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Brown", hex: "#78350F" },
  { name: "Red", hex: "#B91C1C" },
  { name: "Pink", hex: "#BE185D" },
  { name: "Teal", hex: "#0F766E" },
  { name: "Gray", hex: "#4B5563" },
];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function normalizeHexColor(value: string | null | undefined, fallback = DEFAULT_CATEGORY_COLOR): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return fallback;
}
