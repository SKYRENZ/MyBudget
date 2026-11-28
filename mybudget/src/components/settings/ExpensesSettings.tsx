"use client";

import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import {
  CATEGORY_SORT_OPTIONS,
  getDefaultCategorySort,
  getDefaultCategorySortSnapshot,
  getServerDefaultCategorySortSnapshot,
  subscribeDefaultCategorySort,
  updateDefaultCategorySort,
  type CategorySort,
  getExpenseLayout,
  getExpenseLayoutSnapshot,
  getServerExpenseLayoutSnapshot,
  subscribeExpenseLayout,
  updateExpenseLayout,
  type ExpenseLayout,
  getDefaultSort,
  getDefaultSortSnapshot,
  getServerDefaultSortSnapshot,
  subscribeDefaultSort,
  updateDefaultSort,
  type DefaultSort,
  getDefaultPageSize,
  getDefaultPageSizeSnapshot,
  getServerDefaultPageSizeSnapshot,
  subscribeDefaultPageSize,
  updateDefaultPageSize,
  type DefaultPageSize,
} from "@/lib/app-preferences";
import {
  getTransactionDisplayMode,
  getTransactionDisplaySnapshot,
  getServerTransactionDisplaySnapshot,
  subscribeTransactionDisplayMode,
  updateTransactionDisplayMode,
  type TransactionDisplayMode,
  getTransactionInteraction,
  getTransactionInteractionSnapshot,
  getServerTransactionInteractionSnapshot,
  subscribeTransactionInteraction,
  updateTransactionInteraction,
  type TransactionInteraction,
} from "@/lib/transaction-preferences";

const LAYOUT_LABELS: Record<ExpenseLayout, string> = {
  transactions_first: "Transactions First",
  categories_first: "Categories First",
};

const SORT_OPTIONS: { value: DefaultSort; label: string }[] = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "amount_desc", label: "Highest Amount" },
  { value: "amount_asc", label: "Lowest Amount" },
];

const PAGE_SIZES: DefaultPageSize[] = [10, 25, 50, 100];

export function ExpensesSettings() {
  const layout = useSyncExternalStore(
    subscribeExpenseLayout,
    getExpenseLayoutSnapshot,
    getServerExpenseLayoutSnapshot,
  );
  const displayMode = useSyncExternalStore(
    subscribeTransactionDisplayMode,
    getTransactionDisplaySnapshot,
    getServerTransactionDisplaySnapshot,
  );
  const defaultSort = useSyncExternalStore(
    subscribeDefaultSort,
    getDefaultSortSnapshot,
    getServerDefaultSortSnapshot,
  );
  const pageSize = useSyncExternalStore(
    subscribeDefaultPageSize,
    getDefaultPageSizeSnapshot,
    getServerDefaultPageSizeSnapshot,
  );
  const defaultCategorySort = useSyncExternalStore(
    subscribeDefaultCategorySort,
    getDefaultCategorySortSnapshot,
    getServerDefaultCategorySortSnapshot,
  );
  const transactionInteraction = useSyncExternalStore(
    subscribeTransactionInteraction,
    getTransactionInteractionSnapshot,
    getServerTransactionInteractionSnapshot,
  );

  // Fallback reads for initial render (SSR returns defaults; client useSyncExternalStore takes over)
  const resolvedLayout = layout ?? getExpenseLayout();
  const resolvedDisplay = displayMode ?? getTransactionDisplayMode();
  const resolvedSort = defaultSort ?? getDefaultSort();
  const resolvedSize = pageSize ?? getDefaultPageSize();
  const resolvedCategorySort = defaultCategorySort ?? getDefaultCategorySort();
  const resolvedInteraction = transactionInteraction ?? getTransactionInteraction();

  return (
    <div className="grid gap-6">
      {/* Default Expense Layout */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Expenses Page
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Default Layout</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Choose what appears first when you open the Expenses page.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Default expense layout</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {(["transactions_first", "categories_first"] as ExpenseLayout[]).map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  updateExpenseLayout(opt);
                  void api.preferences.update({ expenseLayout: opt }).catch(() => {});
                }}
                className={`py-3 text-sm font-bold transition-colors ${i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${
                  resolvedLayout === opt
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {LAYOUT_LABELS[opt]}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Transaction Display */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Transaction Display
        </p>
        <fieldset className="mt-2">
          <legend className="sr-only">Transaction display mode</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {(["pagination", "infinite"] as TransactionDisplayMode[]).map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  updateTransactionDisplayMode(opt);
                  void api.preferences.update({ transactionDisplay: opt }).catch(() => {});
                }}
                className={`py-3 text-sm font-bold transition-colors ${i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${
                  resolvedDisplay === opt
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {opt === "pagination" ? "Pagination" : "Infinite Scroll"}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          Choose page controls or automatic loading as you scroll.
        </p>
      </section>

      {/* Transactions Per Page */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Transactions Per Page
        </p>
        <fieldset className="mt-2">
          <legend className="sr-only">Transactions per page</legend>
          <div className="grid grid-cols-4 border border-ink/15 dark:border-white/10">
            {PAGE_SIZES.map((size, i) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  updateDefaultPageSize(size);
                  void api.preferences.update({ pageSize: size }).catch(() => {});
                }}
                className={`py-3 text-sm font-bold transition-colors ${i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${
                  resolvedSize === size
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs text-ink-soft dark:text-[#cfc2af]">
          Active when Pagination mode is enabled.
        </p>
      </section>

      {/* Default Sorting */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Default Sorting
        </p>
        <fieldset className="mt-2">
          <legend className="sr-only">Default sort order</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {SORT_OPTIONS.map(({ value, label }, i) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  updateDefaultSort(value);
                  void api.preferences.update({ defaultSort: value }).catch(() => {});
                }}
                className={`py-3 text-xs font-bold transition-colors ${i % 2 !== 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${i >= 2 ? "border-t border-ink/15 dark:border-white/10" : ""} ${
                  resolvedSort === value
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs text-ink-soft dark:text-[#cfc2af]">
          Applied when no manual sort is selected on the Expenses page.
        </p>
      </section>

      {/* Default Category Sort */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Default Category Sort
        </p>
        <div className="mt-2">
          <select
            aria-label="Default Category Sort"
            value={resolvedCategorySort}
            onChange={(e) => {
              const next = e.target.value as CategorySort;
              updateDefaultCategorySort(next);
              void api.preferences.update({ defaultCategorySort: next }).catch(() => {});
            }}
            className="w-full border border-ink/15 bg-paper px-3 py-3 text-sm font-semibold outline-none transition-colors focus:border-ember-deep dark:border-white/10 dark:bg-[#211b17] dark:text-[#f7eddd]"
          >
            {CATEGORY_SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          This determines how categories are displayed when opening the Expenses page.
        </p>
      </section>

      {/* Transaction Interaction */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Transaction Interaction
        </p>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          How transaction details open when you tap a row.
        </p>
        <fieldset className="mt-2">
          <legend className="sr-only">Transaction interaction mode</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {(["floating", "inline"] as TransactionInteraction[]).map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  updateTransactionInteraction(opt);
                  void api.preferences.update({ transactionInteraction: opt }).catch(() => {});
                }}
                className={`py-3 text-sm font-bold transition-colors ${i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${
                  resolvedInteraction === opt
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {opt === "floating" ? "Detail Card" : "Inline Expand"}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          Detail Card opens a floating sheet. Inline Expand shows details in the list.
        </p>
      </section>
    </div>
  );
}
