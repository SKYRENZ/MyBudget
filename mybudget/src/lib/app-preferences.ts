// ─── App-wide preference helpers ────────────────────────────────────────────
// Each preference follows the same pattern:
//   get<Pref>()          → reads localStorage (SSR-safe)
//   update<Pref>(v)      → writes + dispatches event
//   subscribe<Pref>(cb)  → wires event listeners, returns unsubscriber
//   get<Pref>Snapshot()  → stable reference for useSyncExternalStore (client)
//   getServer<Pref>Snapshot() → SSR fallback for useSyncExternalStore

// ─── Expense Layout ──────────────────────────────────────────────────────────
export type ExpenseLayout = "transactions_first" | "categories_first";

const EXPENSE_LAYOUT_KEY = "mybudget-expense-layout";
const EXPENSE_LAYOUT_EVENT = "mybudget-expense-layout-change";

export function getExpenseLayout(): ExpenseLayout {
  if (typeof window === "undefined") return "transactions_first";
  return window.localStorage.getItem(EXPENSE_LAYOUT_KEY) === "categories_first"
    ? "categories_first"
    : "transactions_first";
}

export function updateExpenseLayout(layout: ExpenseLayout) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXPENSE_LAYOUT_KEY, layout);
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

// ─── Default Sort ────────────────────────────────────────────────────────────
export type DefaultSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const DEFAULT_SORT_KEY = "mybudget-default-sort";
const DEFAULT_SORT_EVENT = "mybudget-default-sort-change";

const VALID_SORTS: DefaultSort[] = ["date_desc", "date_asc", "amount_desc", "amount_asc"];

export function getDefaultSort(): DefaultSort {
  if (typeof window === "undefined") return "date_desc";
  const stored = window.localStorage.getItem(DEFAULT_SORT_KEY) as DefaultSort | null;
  return stored && VALID_SORTS.includes(stored) ? stored : "date_desc";
}

export function updateDefaultSort(sort: DefaultSort) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEFAULT_SORT_KEY, sort);
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

// ─── Default Page Size ───────────────────────────────────────────────────────
export type DefaultPageSize = 25 | 50 | 100;

const DEFAULT_PAGE_SIZE_KEY = "mybudget-page-size";
const DEFAULT_PAGE_SIZE_EVENT = "mybudget-page-size-change";

const VALID_SIZES: DefaultPageSize[] = [25, 50, 100];

export function getDefaultPageSize(): DefaultPageSize {
  if (typeof window === "undefined") return 25;
  const stored = Number(window.localStorage.getItem(DEFAULT_PAGE_SIZE_KEY)) as DefaultPageSize;
  return VALID_SIZES.includes(stored) ? stored : 25;
}

export function updateDefaultPageSize(size: DefaultPageSize) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEFAULT_PAGE_SIZE_KEY, String(size));
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

// ─── Date Format (placeholder — not wired to display yet) ───────────────────
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

const DATE_FORMAT_KEY = "mybudget-date-format";
const DATE_FORMAT_EVENT = "mybudget-date-format-change";

const VALID_DATE_FORMATS: DateFormat[] = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

export function getDateFormat(): DateFormat {
  if (typeof window === "undefined") return "MM/DD/YYYY";
  const stored = window.localStorage.getItem(DATE_FORMAT_KEY) as DateFormat | null;
  return stored && VALID_DATE_FORMATS.includes(stored) ? stored : "MM/DD/YYYY";
}

export function updateDateFormat(format: DateFormat) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATE_FORMAT_KEY, format);
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

// ─── Default Category Sort ───────────────────────────────────────────────────
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

const VALID_CATEGORY_SORTS: CategorySort[] = CATEGORY_SORT_OPTIONS.map((o) => o.value);

export function getDefaultCategorySort(): CategorySort {
  if (typeof window === "undefined") return "manual";
  const stored = window.localStorage.getItem(CATEGORY_SORT_KEY) as CategorySort | null;
  return stored && VALID_CATEGORY_SORTS.includes(stored) ? stored : "manual";
}

export function updateDefaultCategorySort(sort: CategorySort) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CATEGORY_SORT_KEY, sort);
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
