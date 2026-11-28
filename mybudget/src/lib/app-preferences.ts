// Updated to scope preferences per authenticated user
"use client";

import { useSyncExternalStore } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase client (public anon key, environment vars should be set)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";
let supabaseClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}
// Use a shared instance for the rest of the file
const supabase = getSupabase();

// Synchronous helper to get current user ID (if Supabase session is available)
function getCurrentUserIdSync(): string | null {
  const authWithLegacySession = supabase.auth as unknown as {
    session?: () => { user?: { id?: string } } | null;
  };
  const session = authWithLegacySession.session?.();
  return session?.user?.id ?? null;
}

// Build a storage key scoped to a user (or global fallback)
function scopedKey(base: string, userId: string | null): string {
  return userId ? `${userId}-${base}` : base;
}

// Types for preferences stored in user_metadata
export type UserPreferencesPayload = {
  expenseLayout?: ExpenseLayout;
  defaultSort?: DefaultSort;
  pageSize?: DefaultPageSize;
  dateFormat?: DateFormat;
  defaultCategorySort?: CategorySort;
};

// ─── Expense Layout ──────────────────────────────────────────────────────────────
export type ExpenseLayout = "transactions_first" | "categories_first";
const EXPENSE_LAYOUT_KEY = "mybudget-expense-layout";
const EXPENSE_LAYOUT_EVENT = "mybudget-expense-layout-change";

export function getExpenseLayout(): ExpenseLayout {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return "transactions_first";
  const val = window.localStorage.getItem(scopedKey(EXPENSE_LAYOUT_KEY, userId));
  return val === "categories_first" ? "categories_first" : "transactions_first";
}

export function updateExpenseLayout(layout: ExpenseLayout) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(EXPENSE_LAYOUT_KEY, userId), layout);
  window.dispatchEvent(new Event(EXPENSE_LAYOUT_EVENT));
}

export function subscribeExpenseLayout(callback: () => void) {
  window.addEventListener(EXPENSE_LAYOUT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EXPENSE_LAYOUT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getExpenseLayoutSnapshot(): ExpenseLayout {
  return getExpenseLayout();
}
export function getServerExpenseLayoutSnapshot(): ExpenseLayout {
  return "transactions_first";
}

// ─── Default Sort ───────────────────────────────────────────────────────────────
export type DefaultSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
const DEFAULT_SORT_KEY = "mybudget-default-sort";
const DEFAULT_SORT_EVENT = "mybudget-default-sort-change";
const VALID_SORTS: DefaultSort[] = ["date_desc", "date_asc", "amount_desc", "amount_asc"];

export function getDefaultSort(): DefaultSort {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return "date_desc";
  const stored = window.localStorage.getItem(scopedKey(DEFAULT_SORT_KEY, userId)) as DefaultSort | null;
  return stored && VALID_SORTS.includes(stored) ? stored : "date_desc";
}

export function updateDefaultSort(sort: DefaultSort) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(DEFAULT_SORT_KEY, userId), sort);
  window.dispatchEvent(new Event(DEFAULT_SORT_EVENT));
}

export function subscribeDefaultSort(callback: () => void) {
  window.addEventListener(DEFAULT_SORT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEFAULT_SORT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDefaultSortSnapshot(): DefaultSort {
  return getDefaultSort();
}
export function getServerDefaultSortSnapshot(): DefaultSort {
  return "date_desc";
}

// ─── Default Page Size ────────────────────────────────────────────────────────
export type DefaultPageSize = 25 | 50 | 100;
const DEFAULT_PAGE_SIZE_KEY = "mybudget-page-size";
const DEFAULT_PAGE_SIZE_EVENT = "mybudget-page-size-change";
const VALID_SIZES: DefaultPageSize[] = [25, 50, 100];

export function getDefaultPageSize(): DefaultPageSize {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return 25;
  const stored = Number(window.localStorage.getItem(scopedKey(DEFAULT_PAGE_SIZE_KEY, userId))) as DefaultPageSize;
  return VALID_SIZES.includes(stored) ? stored : 25;
}

export function updateDefaultPageSize(size: DefaultPageSize) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(DEFAULT_PAGE_SIZE_KEY, userId), String(size));
  window.dispatchEvent(new Event(DEFAULT_PAGE_SIZE_EVENT));
}

export function subscribeDefaultPageSize(callback: () => void) {
  window.addEventListener(DEFAULT_PAGE_SIZE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEFAULT_PAGE_SIZE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDefaultPageSizeSnapshot(): DefaultPageSize {
  return getDefaultPageSize();
}
export function getServerDefaultPageSizeSnapshot(): DefaultPageSize {
  return 25;
}

// ─── Date Format (placeholder) ────────────────────────────────────────────────
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
const DATE_FORMAT_KEY = "mybudget-date-format";
const DATE_FORMAT_EVENT = "mybudget-date-format-change";
const VALID_DATE_FORMATS: DateFormat[] = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

export function getDateFormat(): DateFormat {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return "MM/DD/YYYY";
  const stored = window.localStorage.getItem(scopedKey(DATE_FORMAT_KEY, userId)) as DateFormat | null;
  return stored && VALID_DATE_FORMATS.includes(stored) ? stored : "MM/DD/YYYY";
}

export function updateDateFormat(format: DateFormat) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(DATE_FORMAT_KEY, userId), format);
  window.dispatchEvent(new Event(DATE_FORMAT_EVENT));
}

export function subscribeDateFormat(callback: () => void) {
  window.addEventListener(DATE_FORMAT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DATE_FORMAT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDateFormatSnapshot(): DateFormat {
  return getDateFormat();
}
export function getServerDateFormatSnapshot(): DateFormat {
  return "MM/DD/YYYY";
}

export function useDateFormat(): DateFormat {
  return useSyncExternalStore(
    subscribeDateFormat,
    getDateFormatSnapshot,
    getServerDateFormatSnapshot,
  );
}

export function formatDisplayDate(
  dateStr: string | null | undefined,
  format?: DateFormat,
): string {
  if (!dateStr) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const activeFormat = format ?? getDateFormat();
  switch (activeFormat) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
}

// ─── Default Category Sort ──────────────────────────────────────────────────────
export type CategorySort =
  | "manual"
  | "spent_desc"
  | "spent_asc"
  | "remaining_desc"
  | "remaining_asc"
  | "name_asc"
  | "name_desc";

export const CATEGORY_SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "manual", label: "Manual Order" },
  { value: "spent_desc", label: "Highest Spending" },
  { value: "spent_asc", label: "Lowest Spending" },
  { value: "remaining_desc", label: "Highest Remaining" },
  { value: "remaining_asc", label: "Lowest Remaining" },
  { value: "name_asc", label: "Alphabetical (A–Z)" },
  { value: "name_desc", label: "Alphabetical (Z–A)" },
];

const CATEGORY_SORT_KEY = "mybudget-default-category-sort";
const CATEGORY_SORT_EVENT = "mybudget-default-category-sort-change";
const VALID_CATEGORY_SORTS: CategorySort[] = CATEGORY_SORT_OPTIONS.map(o => o.value);

export function getDefaultCategorySort(): CategorySort {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return "manual";
  const stored = window.localStorage.getItem(scopedKey(CATEGORY_SORT_KEY, userId)) as CategorySort | null;
  return stored && VALID_CATEGORY_SORTS.includes(stored) ? stored : "manual";
}

export function updateDefaultCategorySort(sort: CategorySort) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(CATEGORY_SORT_KEY, userId), sort);
  window.dispatchEvent(new Event(CATEGORY_SORT_EVENT));
}

export function subscribeDefaultCategorySort(callback: () => void) {
  window.addEventListener(CATEGORY_SORT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CATEGORY_SORT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getDefaultCategorySortSnapshot(): CategorySort {
  return getDefaultCategorySort();
}
export function getServerDefaultCategorySortSnapshot(): CategorySort {
  return "manual";
}

// ─── Monthly Budget Behavior ────────────────────────────────────────────────────
export type BudgetBehavior = "carry_forward" | "manual";
const BUDGET_BEHAVIOR_KEY = "mybudget-budget-behavior";
const BUDGET_BEHAVIOR_EVENT = "mybudget-budget-behavior-change";

export function getBudgetBehavior(): BudgetBehavior {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return "carry_forward";
  const stored = window.localStorage.getItem(scopedKey(BUDGET_BEHAVIOR_KEY, userId));
  return stored === "manual" ? "manual" : "carry_forward";
}

export function updateBudgetBehavior(behavior: BudgetBehavior) {
  const userId = getCurrentUserIdSync();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(BUDGET_BEHAVIOR_KEY, userId), behavior);
  window.dispatchEvent(new Event(BUDGET_BEHAVIOR_EVENT));
}

export function subscribeBudgetBehavior(callback: () => void) {
  window.addEventListener(BUDGET_BEHAVIOR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(BUDGET_BEHAVIOR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getBudgetBehaviorSnapshot(): BudgetBehavior {
  return getBudgetBehavior();
}

export function getServerBudgetBehaviorSnapshot(): BudgetBehavior {
  return "carry_forward";
}

export function useBudgetBehavior(): BudgetBehavior {
  return useSyncExternalStore(
    subscribeBudgetBehavior,
    getBudgetBehaviorSnapshot,
    getServerBudgetBehaviorSnapshot,
  );
}
