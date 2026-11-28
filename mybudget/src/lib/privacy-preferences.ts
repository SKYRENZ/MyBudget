"use client";

import { useSyncExternalStore } from "react";

// ─── Active Hide Amounts state (synced across tabs & components) ─────────────
const HIDE_AMOUNTS_KEY = "mybudget-hide-amounts";
const PRIVACY_EVENT = "mybudget-privacy-change";

export const MASKED_AMOUNT = "••••••";

export function getHideAmounts(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HIDE_AMOUNTS_KEY) === "true";
}

export function updateHideAmounts(hide: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HIDE_AMOUNTS_KEY, hide ? "true" : "false");
  window.dispatchEvent(new Event(PRIVACY_EVENT));
}

export function toggleHideAmounts(): boolean {
  const next = !getHideAmounts();
  updateHideAmounts(next);
  return next;
}

export function subscribeHideAmounts(callback: () => void) {
  window.addEventListener(PRIVACY_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PRIVACY_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getHideAmountsSnapshot(): boolean {
  return getHideAmounts();
}

export function getServerHideAmountsSnapshot(): boolean {
  return false;
}

export function useHideAmounts(): boolean {
  return useSyncExternalStore(
    subscribeHideAmounts,
    getHideAmountsSnapshot,
    getServerHideAmountsSnapshot,
  );
}

// ─── Per-Section Privacy Mode Configuration ─────────────────────────────────
export type PrivacySection =
  | "dashboard"
  | "category_budgets"
  | "transactions"
  | "accounts"
  | "goals_savings"
  | "reports";

export type PrivacyConfig = {
  hide_dashboard: boolean;
  hide_category_budgets: boolean;
  hide_transactions: boolean;
  hide_accounts: boolean;
  hide_goals_savings: boolean;
  hide_reports: boolean;
};

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  hide_dashboard: true,
  hide_category_budgets: true,
  hide_transactions: true,
  hide_accounts: true,
  hide_goals_savings: true,
  hide_reports: true,
};

export const PRIVACY_SECTION_OPTIONS: Array<{
  section: PrivacySection;
  key: keyof PrivacyConfig;
  label: string;
}> = [
  { section: "dashboard", key: "hide_dashboard", label: "Dashboard Values" },
  { section: "category_budgets", key: "hide_category_budgets", label: "Category Budgets" },
  { section: "transactions", key: "hide_transactions", label: "Transactions" },
  { section: "accounts", key: "hide_accounts", label: "Accounts" },
  { section: "goals_savings", key: "hide_goals_savings", label: "Goals & Savings" },
  { section: "reports", key: "hide_reports", label: "Reports" },
];

const SECTION_TO_KEY: Record<PrivacySection, keyof PrivacyConfig> = {
  dashboard: "hide_dashboard",
  category_budgets: "hide_category_budgets",
  transactions: "hide_transactions",
  accounts: "hide_accounts",
  goals_savings: "hide_goals_savings",
  reports: "hide_reports",
};

const PRIVACY_CONFIG_KEY = "mybudget-privacy-config";
const PRIVACY_CONFIG_EVENT = "mybudget-privacy-config-change";
const DEFAULT_CONFIG_SNAPSHOT = JSON.stringify(DEFAULT_PRIVACY_CONFIG);

export function getPrivacyConfig(): PrivacyConfig {
  if (typeof window === "undefined") return DEFAULT_PRIVACY_CONFIG;
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONFIG_KEY);
    if (!raw) return DEFAULT_PRIVACY_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PrivacyConfig>;
    return {
      hide_dashboard: parsed.hide_dashboard ?? true,
      hide_category_budgets: parsed.hide_category_budgets ?? true,
      hide_transactions: parsed.hide_transactions ?? true,
      hide_accounts: parsed.hide_accounts ?? true,
      hide_goals_savings: parsed.hide_goals_savings ?? true,
      hide_reports: parsed.hide_reports ?? true,
    };
  } catch {
    return DEFAULT_PRIVACY_CONFIG;
  }
}

export function updatePrivacyConfig(partial: Partial<PrivacyConfig>): PrivacyConfig {
  const merged: PrivacyConfig = {
    ...getPrivacyConfig(),
    ...partial,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(PRIVACY_CONFIG_EVENT));
  }
  return merged;
}

export function subscribePrivacyConfig(callback: () => void) {
  window.addEventListener(PRIVACY_CONFIG_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PRIVACY_CONFIG_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getPrivacyConfigSnapshot(): string {
  if (typeof window === "undefined") return DEFAULT_CONFIG_SNAPSHOT;
  return window.localStorage.getItem(PRIVACY_CONFIG_KEY) ?? DEFAULT_CONFIG_SNAPSHOT;
}

export function getServerPrivacyConfigSnapshot(): string {
  return DEFAULT_CONFIG_SNAPSHOT;
}

export function usePrivacyConfig(): PrivacyConfig {
  const snapshot = useSyncExternalStore(
    subscribePrivacyConfig,
    getPrivacyConfigSnapshot,
    getServerPrivacyConfigSnapshot,
  );
  try {
    const parsed = JSON.parse(snapshot) as Partial<PrivacyConfig>;
    return {
      hide_dashboard: parsed.hide_dashboard ?? true,
      hide_category_budgets: parsed.hide_category_budgets ?? true,
      hide_transactions: parsed.hide_transactions ?? true,
      hide_accounts: parsed.hide_accounts ?? true,
      hide_goals_savings: parsed.hide_goals_savings ?? true,
      hide_reports: parsed.hide_reports ?? true,
    };
  } catch {
    return DEFAULT_PRIVACY_CONFIG;
  }
}

export function isSectionHidden(section?: PrivacySection): boolean {
  if (!getHideAmounts()) return false;
  if (!section) return true;
  const config = getPrivacyConfig();
  return config[SECTION_TO_KEY[section]];
}

export function useSectionHidden(section: PrivacySection): boolean {
  const hideAmounts = useHideAmounts();
  const config = usePrivacyConfig();
  return hideAmounts && config[SECTION_TO_KEY[section]];
}

// ─── Default Amount Visibility (Settings → Display → Privacy) ───────────────
export type DefaultAmountVisibility = "show" | "hide";

const DEFAULT_VISIBILITY_KEY = "mybudget-default-amount-visibility";
const DEFAULT_VISIBILITY_EVENT = "mybudget-default-amount-visibility-change";

export function getDefaultAmountVisibility(): DefaultAmountVisibility {
  if (typeof window === "undefined") return "show";
  return window.localStorage.getItem(DEFAULT_VISIBILITY_KEY) === "hide" ? "hide" : "show";
}

export function updateDefaultAmountVisibility(mode: DefaultAmountVisibility) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEFAULT_VISIBILITY_KEY, mode);
  window.dispatchEvent(new Event(DEFAULT_VISIBILITY_EVENT));
}

export function subscribeDefaultAmountVisibility(callback: () => void) {
  window.addEventListener(DEFAULT_VISIBILITY_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEFAULT_VISIBILITY_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDefaultAmountVisibilitySnapshot(): DefaultAmountVisibility {
  return getDefaultAmountVisibility();
}

export function getServerDefaultAmountVisibilitySnapshot(): DefaultAmountVisibility {
  return "show";
}

// ─── Auto Hide On Startup ────────────────────────────────────────────────────
const AUTO_HIDE_KEY = "mybudget-auto-hide-startup";
const AUTO_HIDE_EVENT = "mybudget-auto-hide-startup-change";

export function getAutoHideOnStartup(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_HIDE_KEY) === "true";
}

export function updateAutoHideOnStartup(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_HIDE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(AUTO_HIDE_EVENT));
}

export function subscribeAutoHideOnStartup(callback: () => void) {
  window.addEventListener(AUTO_HIDE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTO_HIDE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getAutoHideOnStartupSnapshot(): boolean {
  return getAutoHideOnStartup();
}

export function getServerAutoHideOnStartupSnapshot(): boolean {
  return false;
}
