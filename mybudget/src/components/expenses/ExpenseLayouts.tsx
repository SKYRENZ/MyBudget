"use client";

import type { RefObject } from "react";
import {
  TransactionFilters,
  type TransactionFilterState,
} from "@/components/expenses/TransactionFilters";
import { Skeleton } from "@/components/ui/Skeleton";
import { CATEGORY_SORT_OPTIONS, type CategorySort } from "@/lib/app-preferences";
import { formatCurrency } from "@/lib/currency";
import type { Account, Category, Transaction } from "@/lib/database-types";
import type { TransactionDisplayMode } from "@/lib/transaction-preferences";

// ─── Shared props used by both layouts ───────────────────────────────────────
export type ExpenseLayoutProps = {
  // Data
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  monthlyTransactions: Transaction[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: 25 | 50 | 100;
  // Loading flags
  metaLoading: boolean;
  txLoading: boolean;
  loadingMore: boolean;
  // Filters & Category Sort
  filters: TransactionFilterState;
  categorySort: CategorySort;
  // Display
  displayMode: TransactionDisplayMode;
  loadMoreSentinelRef: RefObject<HTMLDivElement | null>;
  // Callbacks
  onFiltersChange: (next: TransactionFilterState) => void;
  onResetFilters: () => void;
  onPageSizeChange: (size: 25 | 50 | 100) => void;
  onPageChange: (p: number) => void;
  onLoadMore: () => void;
  onEditBudget: (category: Category) => void;
  onCategorySortChange: (sort: CategorySort) => void;
  onOpenCustomize: () => void;
};

// ─── Shared Transactions List (mobile + desktop) ──────────────────────────────
export function TransactionList({
  transactions,
  txLoading,
  displayMode,
  loadingMore,
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onLoadMore,
  loadMoreSentinelRef,
}: {
  transactions: Transaction[];
  txLoading: boolean;
  displayMode: TransactionDisplayMode;
  loadingMore: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: 25 | 50 | 100;
  onPageChange: (p: number) => void;
  onPageSizeChange: (size: 25 | 50 | 100) => void;
  onLoadMore: () => void;
  loadMoreSentinelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd =
    displayMode === "infinite"
      ? transactions.length
      : Math.min(page * pageSize, totalCount);

  return (
    <>
      {/* Mobile stacked list */}
      <div className="min-w-0 divide-y divide-ink/10 md:hidden dark:divide-white/10">
        {txLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : transactions.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft dark:text-[#cfc2af]">
            No matching transactions found.
          </p>
        ) : (
          transactions.map((row) => (
            <div key={row.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {row.description || (row.type === "income" ? "Income" : "Expense")}
                </p>
                <p className="mt-1 truncate text-xs text-ink-soft dark:text-[#cfc2af]">
                  {row.categories?.name || row.type}
                  {row.accounts?.name ? ` · ${row.accounts.name}` : ""} · {row.transaction_date}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  row.type === "income"
                    ? "text-green-700 dark:text-green-400"
                    : row.type === "expense"
                      ? "text-ember-deep"
                      : ""
                }`}
              >
                {row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}
                {formatCurrency(Number(row.amount))}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
            <tr>
              <td className="px-5 py-3">Description</td>
              <td>Type</td>
              <td>Category</td>
              <td>Account</td>
              <td>Date</td>
              <td className="px-5 text-right">Amount</td>
            </tr>
          </thead>
          <tbody>
            {txLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-ink/10 dark:border-white/10">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td>
                      <Skeleton className="h-3 w-14" />
                    </td>
                    <td>
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td>
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td>
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                    <td className="px-5 text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </td>
                  </tr>
                ))
              : transactions.map((row) => (
                  <tr key={row.id} className="border-t border-ink/10 dark:border-white/10">
                    <td className="px-5 py-4 font-bold">
                      {row.description || (row.type === "income" ? "Income" : "Expense")}
                    </td>
                    <td className="text-[0.62rem] uppercase tracking-[0.12em] text-ink-soft dark:text-[#cfc2af]">
                      {row.type}
                    </td>
                    <td>{row.categories?.name || "—"}</td>
                    <td>{row.accounts?.name || "—"}</td>
                    <td className="tabular-nums">{row.transaction_date}</td>
                    <td
                      className={`px-5 text-right font-bold tabular-nums ${
                        row.type === "income"
                          ? "text-green-700 dark:text-green-400"
                          : row.type === "expense"
                            ? "text-ember-deep"
                            : ""
                      }`}
                    >
                      {row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}
                      {formatCurrency(Number(row.amount))}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!txLoading && transactions.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft dark:text-[#cfc2af]">
            No matching transactions found.
          </p>
        ) : null}
      </div>

      {/* Pagination / Infinite Scroll footer */}
      {displayMode === "pagination" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/12 px-4 py-4 text-xs sm:px-5 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-3 text-ink-soft dark:text-[#cfc2af]">
            <span className="tabular-nums">
              Showing {rangeStart}–{rangeEnd} of {totalCount}
            </span>
            <label className="inline-flex items-center gap-2">
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em]">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value) as 25 | 50 | 100);
                }}
                className="border border-ink/15 bg-paper px-2 py-1 text-xs outline-none dark:border-white/15 dark:bg-[#211b17]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || txLoading}
              onClick={() => onPageChange(page - 1)}
              className="border border-ink/20 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] disabled:opacity-40 dark:border-white/15"
            >
              ← Previous
            </button>
            <span className="px-2 tabular-nums text-ink-soft dark:text-[#cfc2af]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || txLoading}
              onClick={() => onPageChange(page + 1)}
              className="border border-ink/20 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] disabled:opacity-40 dark:border-white/15"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-ink/12 px-4 py-4 text-center text-xs text-ink-soft sm:px-5 dark:border-white/10 dark:text-[#cfc2af]">
          <div ref={loadMoreSentinelRef} className="h-1 w-full" />
          {loadingMore ? (
            <p>Loading more transactions…</p>
          ) : totalCount > 0 && transactions.length < totalCount ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ember-deep hover:underline"
            >
              Load more ({transactions.length} of {totalCount})
            </button>
          ) : totalCount > 0 ? (
            <p className="tabular-nums">
              Showing all {totalCount} {totalCount === 1 ? "transaction" : "transactions"}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}

// ─── Sort & Customize Toolbar ────────────────────────────────────────────────
function CategoryBudgetControls({
  categorySort,
  onCategorySortChange,
  onOpenCustomize,
}: {
  categorySort: CategorySort;
  onCategorySortChange: (sort: CategorySort) => void;
  onOpenCustomize: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex min-w-0 items-center border border-ink/20 bg-paper dark:border-white/15 dark:bg-[#211b17]">
        <span className="border-r border-ink/15 px-2.5 py-2 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
          Sort
        </span>
        <select
          aria-label="Sort category budgets"
          value={categorySort}
          onChange={(e) => onCategorySortChange(e.target.value as CategorySort)}
          className="min-w-0 bg-transparent px-2.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] outline-none dark:bg-[#211b17] dark:text-[#f7eddd]"
        >
          {CATEGORY_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onOpenCustomize}
        className="border border-ink/20 bg-paper px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.13em] transition-colors hover:border-ember-deep hover:text-ember-deep dark:border-white/15 dark:bg-[#211b17] dark:text-[#f7eddd]"
      >
        Customize
      </button>
    </div>
  );
}

// ─── Category Budget Card (shared between layouts) ───────────────────────────
export function CategoryBudgetCard({
  category,
  monthlyTransactions,
  onEditBudget,
}: {
  category: Category;
  monthlyTransactions: Transaction[];
  onEditBudget: (cat: Category) => void;
}) {
  const spent = monthlyTransactions
    .filter((r) => r.type === "expense" && r.category_id === category.id)
    .reduce((s, r) => s + Number(r.amount), 0);
  const limit = Number(category.monthly_budget);
  const percent = limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : 0;
  const isOver = percent > 100;

  return (
    <section className="min-w-0 border border-ink/15 bg-paper p-4 sm:p-5 dark:border-white/10 dark:bg-[#211b17]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {category.is_pinned ? (
            <span title="Pinned category" className="shrink-0 text-xs">
              📌
            </span>
          ) : null}
          <h2 className="truncate font-display text-lg font-bold">{category.name}</h2>
        </div>
        <span
          className={`shrink-0 text-xs font-bold ${isOver ? "text-red-600 dark:text-red-400" : "text-ink-soft dark:text-[#cfc2af]"}`}
        >
          {percent}%
        </span>
      </div>
      <div className="mt-4 h-1.5 bg-ink/10 dark:bg-white/10">
        <div
          className={`h-full transition-all ${isOver ? "bg-red-500" : "bg-ember-deep"}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 text-xs">
        <div>
          <p className="text-ink-soft dark:text-[#cfc2af]">Spent</p>
          <b className={isOver ? "text-red-600 dark:text-red-400" : undefined}>
            {formatCurrency(spent)}
          </b>
        </div>
        <div className="text-right">
          <p className="text-ink-soft dark:text-[#cfc2af]">Remaining</p>
          <b className={isOver ? "text-red-600 dark:text-red-400" : undefined}>
            {formatCurrency(limit - spent)}
          </b>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-[0.65rem] dark:border-white/10">
        <span className="text-ink-soft dark:text-[#cfc2af]">Limit {formatCurrency(limit)}</span>
        <button
          type="button"
          onClick={() => onEditBudget(category)}
          className="font-bold uppercase tracking-[0.12em] text-ember-deep hover:underline"
        >
          Edit limit
        </button>
      </div>
    </section>
  );
}

// ─── LAYOUT 1: Transactions First ────────────────────────────────────────────
export function TransactionsFirstLayout({
  categories,
  accounts,
  transactions,
  monthlyTransactions,
  totalCount,
  totalPages,
  page,
  pageSize,
  metaLoading,
  txLoading,
  loadingMore,
  filters,
  categorySort,
  displayMode,
  loadMoreSentinelRef,
  onFiltersChange,
  onResetFilters,
  onPageSizeChange,
  onPageChange,
  onLoadMore,
  onEditBudget,
  onCategorySortChange,
  onOpenCustomize,
}: ExpenseLayoutProps) {
  // Category chip filter
  const activeCategoryName = categories.find((c) => c.id === filters.categoryId)?.name ?? null;

  return (
    <div className="mt-6 grid min-w-0 gap-4">
      {/* ── Transactions section ── */}
      <section className="min-w-0 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
        {/* Header row */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/15 px-4 py-4 sm:p-5 dark:border-white/10">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
              Ledger
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">Transactions</h2>
          </div>
          <p className="text-xs text-ink-soft tabular-nums dark:text-[#cfc2af]">
            {totalCount} {totalCount === 1 ? "transaction" : "transactions"}
          </p>
        </div>

        {/* Category chips (horizontal scroll) — mobile-first */}
        {!metaLoading && categories.length > 0 && (
          <div className="min-w-0 border-b border-ink/15 px-4 py-3 dark:border-white/10">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, categoryId: "" })}
                className={`shrink-0 border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] transition-colors ${
                  !filters.categoryId
                    ? "border-ink bg-ink text-paper dark:border-white/80 dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "border-ink/20 text-ink-soft hover:border-ink/40 dark:border-white/15 dark:text-[#cfc2af]"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      categoryId: filters.categoryId === cat.id ? "" : cat.id,
                    })
                  }
                  className={`shrink-0 border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] transition-colors ${
                    filters.categoryId === cat.id
                      ? "border-ember-deep bg-ember-deep text-white"
                      : "border-ink/20 text-ink-soft hover:border-ink/40 dark:border-white/15 dark:text-[#cfc2af]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {activeCategoryName && (
              <p className="mt-1.5 text-[0.6rem] text-ink-soft dark:text-[#cfc2af]">
                Filtering by <span className="font-bold text-ember-deep">{activeCategoryName}</span>
              </p>
            )}
          </div>
        )}

        {/* Filters (search + date + type + sort + account) */}
        <TransactionFilters
          filters={filters}
          categories={categories}
          accounts={accounts}
          onChange={onFiltersChange}
          onReset={onResetFilters}
        />

        {/* Transaction rows */}
        <TransactionList
          transactions={transactions}
          txLoading={txLoading}
          displayMode={displayMode}
          loadingMore={loadingMore}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onLoadMore={onLoadMore}
          loadMoreSentinelRef={loadMoreSentinelRef}
        />
      </section>

      {/* ── Collapsible Category Budget Summary ── */}
      <CollapsibleCategoryBudgets
        categories={categories}
        monthlyTransactions={monthlyTransactions}
        metaLoading={metaLoading}
        categorySort={categorySort}
        onCategorySortChange={onCategorySortChange}
        onOpenCustomize={onOpenCustomize}
        onEditBudget={onEditBudget}
      />
    </div>
  );
}

// ─── Collapsible budget summary (used in Transactions First mode) ─────────────
function CollapsibleCategoryBudgets({
  categories,
  monthlyTransactions,
  metaLoading,
  categorySort,
  onCategorySortChange,
  onOpenCustomize,
  onEditBudget,
}: {
  categories: Category[];
  monthlyTransactions: Transaction[];
  metaLoading: boolean;
  categorySort: CategorySort;
  onCategorySortChange: (sort: CategorySort) => void;
  onOpenCustomize: () => void;
  onEditBudget: (cat: Category) => void;
}) {
  // No budget section if there are no categories yet
  if (!metaLoading && categories.length === 0) return null;

  return (
    <details className="group min-w-0 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
      <summary className="flex cursor-pointer list-none items-center justify-between p-5">
        <div>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
            Monthly Budgets
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">Category Budgets</h2>
        </div>
        <span className="text-ink-soft transition-transform group-open:rotate-180 dark:text-[#cfc2af]">
          ▾
        </span>
      </summary>
      <div className="border-t border-ink/15 px-4 pb-5 pt-4 sm:px-5 dark:border-white/10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
          <CategoryBudgetControls
            categorySort={categorySort}
            onCategorySortChange={onCategorySortChange}
            onOpenCustomize={onOpenCustomize}
          />
        </div>
        {metaLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-ink/15 p-4 dark:border-white/10">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <CategoryBudgetCard
                key={cat.id}
                category={cat}
                monthlyTransactions={monthlyTransactions}
                onEditBudget={onEditBudget}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

// ─── LAYOUT 2: Categories First ───────────────────────────────────────────────
export function CategoriesFirstLayout({
  categories,
  accounts,
  transactions,
  monthlyTransactions,
  totalCount,
  totalPages,
  page,
  pageSize,
  metaLoading,
  txLoading,
  loadingMore,
  filters,
  categorySort,
  displayMode,
  loadMoreSentinelRef,
  onFiltersChange,
  onResetFilters,
  onPageSizeChange,
  onPageChange,
  onLoadMore,
  onEditBudget,
  onCategorySortChange,
  onOpenCustomize,
}: ExpenseLayoutProps) {
  return (
    <div className="mt-6 grid min-w-0 gap-6">
      {/* ── Category Budget Cards ── */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              Monthly budgets
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-2xl font-bold">Category Budgets</h2>
              <span className="text-xs text-ink-soft dark:text-[#cfc2af]">
                {categories.length} {categories.length === 1 ? "category" : "categories"}
              </span>
            </div>
          </div>
          <CategoryBudgetControls
            categorySort={categorySort}
            onCategorySortChange={onCategorySortChange}
            onOpenCustomize={onOpenCustomize}
          />
        </div>

        {metaLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="mt-5 h-2 w-full" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="border border-ink/15 p-5 text-sm text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            No categories yet — add one to start budgeting.
          </p>
        ) : (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <ExpandableCategoryCard
                key={cat.id}
                category={cat}
                monthlyTransactions={monthlyTransactions}
                allTransactions={transactions}
                onEditBudget={onEditBudget}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Transactions section ── */}
      <section className="min-w-0 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/15 p-5 dark:border-white/10">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
              Ledger
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">All Transactions</h2>
          </div>
          <p className="text-xs text-ink-soft tabular-nums dark:text-[#cfc2af]">
            {totalCount} {totalCount === 1 ? "transaction" : "transactions"}
          </p>
        </div>

        <TransactionFilters
          filters={filters}
          categories={categories}
          accounts={accounts}
          onChange={onFiltersChange}
          onReset={onResetFilters}
        />

        <TransactionList
          transactions={transactions}
          txLoading={txLoading}
          displayMode={displayMode}
          loadingMore={loadingMore}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onLoadMore={onLoadMore}
          loadMoreSentinelRef={loadMoreSentinelRef}
        />
      </section>
    </div>
  );
}

// ─── Expandable Category Card (Categories First mode) ─────────────────────────
function ExpandableCategoryCard({
  category,
  monthlyTransactions,
  allTransactions,
  onEditBudget,
}: {
  category: Category;
  monthlyTransactions: Transaction[];
  allTransactions: Transaction[];
  onEditBudget: (cat: Category) => void;
}) {
  const spent = monthlyTransactions
    .filter((r) => r.type === "expense" && r.category_id === category.id)
    .reduce((s, r) => s + Number(r.amount), 0);
  const limit = Number(category.monthly_budget);
  const percent = limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : 0;
  const isOver = percent > 100;

  // Recent transactions in this category (from server-fetched page)
  const catTxs = allTransactions
    .filter((r) => r.category_id === category.id)
    .slice(0, 5);

  return (
    <details className="group min-w-0 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {category.is_pinned ? (
                <span title="Pinned category" className="shrink-0 text-xs">
                  📌
                </span>
              ) : null}
              <h3 className="truncate font-display text-base font-bold">{category.name}</h3>
            </div>
            <span
              className={`shrink-0 text-xs font-bold ${isOver ? "text-red-600 dark:text-red-400" : "text-ink-soft dark:text-[#cfc2af]"}`}
            >
              {percent}%
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-ink/10 dark:bg-white/10">
            <div
              className={`h-full transition-all ${isOver ? "bg-red-500" : "bg-ember-deep"}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 text-xs">
            <div>
              <p className="text-ink-soft dark:text-[#cfc2af]">Spent</p>
              <b className={isOver ? "text-red-600 dark:text-red-400" : undefined}>
                {formatCurrency(spent)}
              </b>
            </div>
            <div className="text-right">
              <p className="text-ink-soft dark:text-[#cfc2af]">Remaining</p>
              <b className={isOver ? "text-red-600 dark:text-red-400" : undefined}>
                {formatCurrency(limit - spent)}
              </b>
            </div>
          </div>
        </div>
        <span className="mt-1 shrink-0 text-sm text-ink-soft transition-transform group-open:rotate-180 dark:text-[#cfc2af]">
          ▾
        </span>
      </summary>

      {/* Expanded details */}
      <div className="border-t border-ink/10 dark:border-white/10">
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-soft dark:text-[#cfc2af]">
            Limit {formatCurrency(limit)}
          </span>
          <button
            type="button"
            onClick={() => onEditBudget(category)}
            className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ember-deep hover:underline"
          >
            Edit limit
          </button>
        </div>

        {catTxs.length > 0 ? (
          <div className="divide-y divide-ink/8 border-t border-ink/10 dark:divide-white/8 dark:border-white/10">
            {catTxs.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">
                    {row.description || "Expense"}
                  </p>
                  <p className="text-[0.6rem] text-ink-soft dark:text-[#cfc2af]">
                    {row.transaction_date}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-bold tabular-nums text-ember-deep">
                  −{formatCurrency(Number(row.amount))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t border-ink/10 px-5 py-3 text-xs text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            No transactions this month.
          </p>
        )}
      </div>
    </details>
  );
}
