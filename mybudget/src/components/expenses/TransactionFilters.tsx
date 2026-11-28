"use client";

import { useState } from "react";
import { toLocalDateKey } from "@/components/reports/chart-utils";
import { ActionButton } from "@/components/ui/ActionButton";
import type { Account, Category } from "@/lib/database-types";

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export type TransactionSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export type TransactionFilterState = {
  search: string;
  datePreset: DatePreset;
  customStartDate: string;
  customEndDate: string;
  categoryId: string;
  accountId: string;
  type: "" | "income" | "expense" | "transfer";
  sort: TransactionSort;
};

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilterState = {
  search: "",
  datePreset: "all",
  customStartDate: "",
  customEndDate: "",
  categoryId: "",
  accountId: "",
  type: "",
  sort: "date_desc",
};

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "All dates",
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  last_week: "Last week",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom range",
};

const SORT_LABELS: Record<TransactionSort, string> = {
  date_desc: "Newest first",
  date_asc: "Oldest first",
  amount_desc: "Highest amount",
  amount_asc: "Lowest amount",
};

export function resolveDateRange(
  filters: Pick<TransactionFilterState, "datePreset" | "customStartDate" | "customEndDate">,
  referenceDate: Date | null,
): { startDate: string; endDate: string } {
  if (filters.datePreset === "custom") {
    return {
      startDate: filters.customStartDate,
      endDate: filters.customEndDate,
    };
  }
  if (filters.datePreset === "all" || !referenceDate) {
    return { startDate: "", endDate: "" };
  }

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  switch (filters.datePreset) {
    case "today": {
      const key = toLocalDateKey(today);
      return { startDate: key, endDate: key };
    }
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const key = toLocalDateKey(y);
      return { startDate: key, endDate: key };
    }
    case "this_week": {
      const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0..Sun=6
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toLocalDateKey(monday), endDate: toLocalDateKey(sunday) };
    }
    case "last_week": {
      const dayOfWeek = (today.getDay() + 6) % 7;
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - dayOfWeek);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { startDate: toLocalDateKey(lastMonday), endDate: toLocalDateKey(lastSunday) };
    }
    case "this_month": {
      const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const last = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      return { startDate: toLocalDateKey(first), endDate: toLocalDateKey(last) };
    }
    case "last_month": {
      const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
      const last = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
      return { startDate: toLocalDateKey(first), endDate: toLocalDateKey(last) };
    }
    default:
      return { startDate: "", endDate: "" };
  }
}

type Props = {
  filters: TransactionFilterState;
  categories: Category[];
  accounts: Account[];
  onChange: (next: TransactionFilterState) => void;
  onReset: () => void;
};

const controlClass =
  "w-full border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-ember-deep dark:border-white/15 dark:bg-[#211b17]";

export function TransactionFilters({
  filters,
  categories,
  accounts,
  onChange,
  onReset,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState<TransactionFilterState>(filters);

  const activeBadges: Array<{ key: string; label: string; clear: () => void }> = [];

  if (filters.search.trim()) {
    activeBadges.push({
      key: "search",
      label: `Search: "${filters.search.trim()}"`,
      clear: () => onChange({ ...filters, search: "" }),
    });
  }
  if (filters.datePreset !== "all") {
    const label =
      filters.datePreset === "custom"
        ? `Date: ${filters.customStartDate || "…"} → ${filters.customEndDate || "…"}`
        : `Date: ${DATE_PRESET_LABELS[filters.datePreset]}`;
    activeBadges.push({
      key: "date",
      label,
      clear: () =>
        onChange({ ...filters, datePreset: "all", customStartDate: "", customEndDate: "" }),
    });
  }
  if (filters.categoryId) {
    const categoryName =
      filters.categoryId === "uncategorized"
        ? "Uncategorized"
        : categories.find((c) => c.id === filters.categoryId)?.name ?? "Category";
    activeBadges.push({
      key: "category",
      label: `Category: ${categoryName}`,
      clear: () => onChange({ ...filters, categoryId: "" }),
    });
  }
  if (filters.accountId) {
    const accountName = accounts.find((a) => a.id === filters.accountId)?.name ?? "Account";
    activeBadges.push({
      key: "account",
      label: `Account: ${accountName}`,
      clear: () => onChange({ ...filters, accountId: "" }),
    });
  }
  if (filters.type) {
    activeBadges.push({
      key: "type",
      label: `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`,
      clear: () => onChange({ ...filters, type: "" }),
    });
  }
  if (filters.sort !== "date_desc") {
    activeBadges.push({
      key: "sort",
      label: `Sort: ${SORT_LABELS[filters.sort]}`,
      clear: () => onChange({ ...filters, sort: "date_desc" }),
    });
  }

  function openMobileSheet() {
    setDraft(filters);
    setMobileOpen(true);
  }

  function applyMobileSheet() {
    onChange(draft);
    setMobileOpen(false);
  }

  function resetMobileSheet() {
    setDraft(DEFAULT_TRANSACTION_FILTERS);
    onReset();
    setMobileOpen(false);
  }

  return (
    <div className="border-b border-ink/12 bg-cream/35 px-4 py-4 sm:px-5 dark:border-white/10 dark:bg-white/[0.02]">
      {/* Mobile search + Filters button */}
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <input
          type="search"
          aria-label="Search transactions"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search transactions…"
          className="min-w-0 flex-1 border border-ink/15 bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-ember-deep dark:border-white/15 dark:bg-[#211b17]"
        />
        <button
          type="button"
          onClick={openMobileSheet}
          className="inline-flex shrink-0 items-center gap-1.5 border border-ink/20 bg-paper px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] dark:border-white/15 dark:bg-[#211b17]"
        >
          <span>Filters</span>
          {activeBadges.length > 0 ? (
            <span className="bg-ember-deep px-1.5 py-0.5 text-[0.58rem] text-white">
              {activeBadges.length}
            </span>
          ) : null}
        </button>
      </div>
      {activeBadges.length > 0 ? (
        <div className="mt-2 flex justify-end md:hidden">
          <button
            type="button"
            onClick={onReset}
            className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ember-deep hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {/* Desktop filter controls */}
      <div className="hidden md:block">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="block lg:col-span-2">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Search
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Description or notes…"
              className={`mt-1.5 ${controlClass}`}
            />
          </label>

          <label className="block">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Date
            </span>
            <select
              value={filters.datePreset}
              onChange={(event) =>
                onChange({ ...filters, datePreset: event.target.value as DatePreset })
              }
              className={`mt-1.5 ${controlClass}`}
            >
              {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Category
            </span>
            <select
              value={filters.categoryId}
              onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
              className={`mt-1.5 ${controlClass}`}
            >
              <option value="">All categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Account
            </span>
            <select
              value={filters.accountId}
              onChange={(event) => onChange({ ...filters, accountId: event.target.value })}
              className={`mt-1.5 ${controlClass}`}
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Type
            </span>
            <select
              value={filters.type}
              onChange={(event) =>
                onChange({
                  ...filters,
                  type: event.target.value as TransactionFilterState["type"],
                })
              }
              className={`mt-1.5 ${controlClass}`}
            >
              <option value="">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {filters.datePreset === "custom" ? (
              <>
                <label className="block">
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                    From
                  </span>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(event) =>
                      onChange({ ...filters, customStartDate: event.target.value })
                    }
                    className={`mt-1.5 ${controlClass}`}
                  />
                </label>
                <label className="block">
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                    To
                  </span>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(event) =>
                      onChange({ ...filters, customEndDate: event.target.value })
                    }
                    className={`mt-1.5 ${controlClass}`}
                  />
                </label>
              </>
            ) : null}

            <label className="block min-w-44">
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                Sort by
              </span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  onChange({ ...filters, sort: event.target.value as TransactionSort })
                }
                className={`mt-1.5 ${controlClass}`}
              >
                <option value="date_desc">Date · Newest first</option>
                <option value="date_asc">Date · Oldest first</option>
                <option value="amount_desc">Amount · Highest first</option>
                <option value="amount_asc">Amount · Lowest first</option>
              </select>
            </label>
          </div>

          {activeBadges.length > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="border border-ink/20 bg-paper px-3.5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink dark:border-white/15 dark:bg-[#211b17] dark:text-[#cfc2af]"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Active filter badges */}
      {activeBadges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeBadges.map((badge) => (
            <button
              key={badge.key}
              type="button"
              onClick={badge.clear}
              className="inline-flex items-center gap-1.5 border border-ink/15 bg-paper px-2.5 py-1 text-[0.65rem] font-medium text-ink transition-colors hover:border-ember-deep dark:border-white/15 dark:bg-[#211b17] dark:text-[#f7eddd]"
            >
              <span>{badge.label}</span>
              <span aria-hidden="true" className="text-ember-deep">
                ×
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Mobile slide-up filter sheet */}
      {mobileOpen ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17]">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  Transactions
                </p>
                <h2 id="mobile-filters-title" className="mt-1 font-display text-2xl font-bold">
                  Filters &amp; sort
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft dark:border-white/15 dark:text-[#cfc2af]"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Search transactions
                </span>
                <input
                  type="search"
                  value={draft.search}
                  onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                  placeholder="Description or notes…"
                  className={`mt-2 ${controlClass}`}
                />
              </label>

              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Date range
                </span>
                <select
                  value={draft.datePreset}
                  onChange={(event) =>
                    setDraft({ ...draft, datePreset: event.target.value as DatePreset })
                  }
                  className={`mt-2 ${controlClass}`}
                >
                  {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {draft.datePreset === "custom" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                      From
                    </span>
                    <input
                      type="date"
                      value={draft.customStartDate}
                      onChange={(event) =>
                        setDraft({ ...draft, customStartDate: event.target.value })
                      }
                      className={`mt-2 ${controlClass}`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                      To
                    </span>
                    <input
                      type="date"
                      value={draft.customEndDate}
                      onChange={(event) =>
                        setDraft({ ...draft, customEndDate: event.target.value })
                      }
                      className={`mt-2 ${controlClass}`}
                    />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Category
                </span>
                <select
                  value={draft.categoryId}
                  onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
                  className={`mt-2 ${controlClass}`}
                >
                  <option value="">All categories</option>
                  <option value="uncategorized">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Account
                </span>
                <select
                  value={draft.accountId}
                  onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}
                  className={`mt-2 ${controlClass}`}
                >
                  <option value="">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Transaction type
                </span>
                <select
                  value={draft.type}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      type: event.target.value as TransactionFilterState["type"],
                    })
                  }
                  className={`mt-2 ${controlClass}`}
                >
                  <option value="">All types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Sort by
                </span>
                <select
                  value={draft.sort}
                  onChange={(event) =>
                    setDraft({ ...draft, sort: event.target.value as TransactionSort })
                  }
                  className={`mt-2 ${controlClass}`}
                >
                  <option value="date_desc">Date · Newest first</option>
                  <option value="date_asc">Date · Oldest first</option>
                  <option value="amount_desc">Amount · Highest first</option>
                  <option value="amount_asc">Amount · Lowest first</option>
                </select>
              </label>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17]">
              <ActionButton onClick={resetMobileSheet}>Reset</ActionButton>
              <ActionButton primary onClick={applyMobileSheet}>
                Apply filters
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
