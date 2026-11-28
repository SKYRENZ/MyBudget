export type TransactionDisplayMode = "pagination" | "infinite";
export type CategoryIndicatorStyle = "bar_dot" | "bar" | "dot" | "minimal";

export const TRANSACTION_DISPLAY_EVENT = "mybudget-transaction-display-change";
const STORAGE_KEY = "mybudget-transaction-display";

export const CATEGORY_INDICATOR_EVENT = "mybudget-category-indicator-change";
const INDICATOR_STORAGE_KEY = "mybudget-category-indicator-style";

export const CATEGORY_INDICATOR_OPTIONS: Array<{
  value: CategoryIndicatorStyle;
  label: string;
  description: string;
}> = [
  {
    value: "bar_dot",
    label: "Accent Bar + Dot",
    description: "Left color bar and category dot",
  },
  {
    value: "bar",
    label: "Accent Bar Only",
    description: "Subtle left color bar beside each row",
  },
  {
    value: "dot",
    label: "Dot Only",
    description: "Small color dot beside the category name",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Clean typography without color markers",
  },
];

export function getTransactionDisplayMode(): TransactionDisplayMode {
  if (typeof window === "undefined") return "pagination";
  return window.localStorage.getItem(STORAGE_KEY) === "infinite" ? "infinite" : "pagination";
}

export function subscribeTransactionDisplayMode(callback: () => void) {
  window.addEventListener(TRANSACTION_DISPLAY_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(TRANSACTION_DISPLAY_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getTransactionDisplaySnapshot(): TransactionDisplayMode {
  return getTransactionDisplayMode();
}

export function getServerTransactionDisplaySnapshot(): TransactionDisplayMode {
  return "pagination";
}

export function updateTransactionDisplayMode(mode: TransactionDisplayMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event(TRANSACTION_DISPLAY_EVENT));
}

export function getCategoryIndicatorStyle(): CategoryIndicatorStyle {
  if (typeof window === "undefined") return "bar_dot";
  const val = window.localStorage.getItem(INDICATOR_STORAGE_KEY);
  if (val === "bar" || val === "dot" || val === "minimal" || val === "bar_dot") {
    return val;
  }
  return "bar_dot";
}

export function subscribeCategoryIndicatorStyle(callback: () => void) {
  window.addEventListener(CATEGORY_INDICATOR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CATEGORY_INDICATOR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getCategoryIndicatorStyleSnapshot(): CategoryIndicatorStyle {
  return getCategoryIndicatorStyle();
}

export function getServerCategoryIndicatorStyleSnapshot(): CategoryIndicatorStyle {
  return "bar_dot";
}

export function updateCategoryIndicatorStyle(style: CategoryIndicatorStyle) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDICATOR_STORAGE_KEY, style);
  window.dispatchEvent(new Event(CATEGORY_INDICATOR_EVENT));
}
