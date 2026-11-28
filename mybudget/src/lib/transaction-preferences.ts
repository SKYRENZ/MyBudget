export type TransactionDisplayMode = "pagination" | "infinite";

export const TRANSACTION_DISPLAY_EVENT = "mybudget-transaction-display-change";
const STORAGE_KEY = "mybudget-transaction-display";

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
