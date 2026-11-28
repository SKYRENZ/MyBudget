"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CategoryCustomizeSheet } from "@/components/expenses/CategoryCustomizeSheet";
import {
  CategoriesFirstLayout,
  TransactionsFirstLayout,
} from "@/components/expenses/ExpenseLayouts";
import {
  DEFAULT_TRANSACTION_FILTERS,
  resolveDateRange,
  type TransactionFilterState,
  type TransactionSort,
} from "@/components/expenses/TransactionFilters";
import { ActionButton } from "@/components/ui/ActionButton";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import {
  type CategorySort,
  getDefaultCategorySortSnapshot,
  getDefaultPageSizeSnapshot,
  getDefaultSortSnapshot,
  getExpenseLayoutSnapshot,
  getServerDefaultCategorySortSnapshot,
  getServerDefaultPageSizeSnapshot,
  getServerDefaultSortSnapshot,
  getServerExpenseLayoutSnapshot,
  subscribeDefaultCategorySort,
  subscribeDefaultPageSize,
  subscribeDefaultSort,
  subscribeExpenseLayout,
  updateExpenseLayout,
} from "@/lib/app-preferences";
import { getCurrencySymbol, toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Account, Category, DashboardData, Transaction } from "@/lib/database-types";
import {
  getServerTransactionDisplaySnapshot,
  getTransactionDisplaySnapshot,
  subscribeTransactionDisplayMode,
} from "@/lib/transaction-preferences";

function currentLocalDate() {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ExpensesPage() {
  const displayMode = useSyncExternalStore(
    subscribeTransactionDisplayMode,
    getTransactionDisplaySnapshot,
    getServerTransactionDisplaySnapshot,
  );
  const expenseLayout = useSyncExternalStore(
    subscribeExpenseLayout,
    getExpenseLayoutSnapshot,
    getServerExpenseLayoutSnapshot,
  );
  const defaultPageSize = useSyncExternalStore(
    subscribeDefaultPageSize,
    getDefaultPageSizeSnapshot,
    getServerDefaultPageSizeSnapshot,
  );
  const defaultSort = useSyncExternalStore(
    subscribeDefaultSort,
    getDefaultSortSnapshot,
    getServerDefaultSortSnapshot,
  );
  const defaultCategorySort = useSyncExternalStore(
    subscribeDefaultCategorySort,
    getDefaultCategorySortSnapshot,
    getServerDefaultCategorySortSnapshot,
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSizeOverride, setPageSizeOverride] = useState<25 | 50 | 100 | null>(null);
  const [sortOverride, setSortOverride] = useState<TransactionSort | null>(null);
  const [categorySortOverride, setCategorySortOverride] = useState<CategorySort | null>(null);
  const [showCustomizeSheet, setShowCustomizeSheet] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [txLoading, setTxLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_TRANSACTION_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  const pageSize = pageSizeOverride ?? defaultPageSize;
  const effectiveCategorySort = categorySortOverride ?? defaultCategorySort;
  const effectiveFilters = useMemo<TransactionFilterState>(
    () => ({ ...filters, sort: sortOverride ?? defaultSort }),
    [filters, sortOverride, defaultSort],
  );

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBudget, setCategoryBudget] = useState("");
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadMetadata = useCallback(async () => {
    const now = new Date();
    const dashboardData = (await api.dashboard(
      now.getMonth() + 1,
      now.getFullYear(),
    )) as DashboardData;
    setCategories(dashboardData.categories ?? []);
    setAccounts(dashboardData.accounts ?? []);
    setMonthlyTransactions(dashboardData.transactions ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const current = new Date();
    (api.dashboard(current.getMonth() + 1, current.getFullYear()) as Promise<DashboardData>)
      .then((dashboardData) => {
        if (cancelled) return;
        setNow(current);
        setCategories(dashboardData.categories ?? []);
        setAccounts(dashboardData.accounts ?? []);
        setMonthlyTransactions(dashboardData.transactions ?? []);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load expenses");
        }
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDateRange = useMemo(
    () =>
      resolveDateRange(
        {
          datePreset: filters.datePreset,
          customStartDate: filters.customStartDate,
          customEndDate: filters.customEndDate,
        },
        now,
      ),
    [filters.datePreset, filters.customStartDate, filters.customEndDate, now],
  );

  const fetchTransactionsPage = useCallback(
    async (targetPage: number, append: boolean) => {
      const reqId = ++requestIdRef.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setTxLoading(true);
      }

      try {
        const result = await api.transactions.query({
          page: targetPage,
          pageSize,
          search: debouncedSearch,
          startDate: activeDateRange.startDate,
          endDate: activeDateRange.endDate,
          categoryId: filters.categoryId,
          accountId: filters.accountId,
          type: filters.type,
          sort: effectiveFilters.sort,
        });

        if (reqId !== requestIdRef.current) return;

        setTotalCount(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
        setTransactions((prev) => (append ? [...prev, ...result.items] : result.items));
      } catch (reason) {
        if (reqId !== requestIdRef.current) return;
        setError(reason instanceof Error ? reason.message : "Could not load transactions");
      } finally {
        if (reqId === requestIdRef.current) {
          setTxLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [
      activeDateRange.endDate,
      activeDateRange.startDate,
      debouncedSearch,
      effectiveFilters.sort,
      filters.accountId,
      filters.categoryId,
      filters.type,
      pageSize,
    ],
  );

  // Reset to page 1 whenever filters, sort, pageSize, or displayMode change
  useEffect(() => {
    let cancelled = false;
    const reqId = ++requestIdRef.current;

    api.transactions
      .query({
        page: 1,
        pageSize,
        search: debouncedSearch,
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        categoryId: filters.categoryId,
        accountId: filters.accountId,
        type: filters.type,
        sort: effectiveFilters.sort,
      })
      .then((result) => {
        if (cancelled || reqId !== requestIdRef.current) return;
        setTotalCount(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
        setTransactions(result.items);
      })
      .catch((reason) => {
        if (cancelled || reqId !== requestIdRef.current) return;
        setError(reason instanceof Error ? reason.message : "Could not load transactions");
      })
      .finally(() => {
        if (!cancelled && reqId === requestIdRef.current) {
          setTxLoading(false);
          setLoadingMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeDateRange.endDate,
    activeDateRange.startDate,
    debouncedSearch,
    displayMode,
    effectiveFilters.sort,
    filters.accountId,
    filters.categoryId,
    filters.type,
    pageSize,
  ]);

  // Infinite scroll observer when displayMode === "infinite"
  useEffect(() => {
    if (displayMode !== "infinite") return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (txLoading || loadingMore) return;
        if (page >= totalPages) return;
        void fetchTransactionsPage(page + 1, true);
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayMode, fetchTransactionsPage, loadingMore, page, totalPages, txLoading]);

  function handleFiltersChange(next: TransactionFilterState) {
    if (next.sort !== effectiveFilters.sort) {
      setSortOverride(next.sort);
    }
    setFilters(next);
    setPage(1);
  }

  function handleResetFilters() {
    setFilters(DEFAULT_TRANSACTION_FILTERS);
    setSortOverride(null);
    setDebouncedSearch("");
    setPage(1);
  }

  async function refreshAll() {
    await Promise.all([loadMetadata(), fetchTransactionsPage(1, false)]);
  }

  async function submitExpense() {
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError("Enter a description and an amount greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.transactions.create({
        type: "expense",
        description: description.trim(),
        amount: toStoredUsd(numericAmount),
        category_id: categoryId || null,
        account_id: accountId || null,
        transaction_date: transactionDate || currentLocalDate(),
        notes: null,
      });
      setDescription("");
      setAmount("");
      setCategoryId("");
      setAccountId("");
      setShowExpenseForm(false);
      await refreshAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add expense");
    } finally {
      setSaving(false);
    }
  }

  async function submitIncome() {
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError("Enter a description and an income amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.transactions.create({
        type: "income",
        description: description.trim(),
        amount: toStoredUsd(numericAmount),
        category_id: null,
        account_id: accountId || null,
        transaction_date: transactionDate || currentLocalDate(),
        notes: null,
      });
      setDescription("");
      setAmount("");
      setAccountId("");
      setShowIncomeForm(false);
      await refreshAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add income");
    } finally {
      setSaving(false);
    }
  }

  async function submitCategory() {
    const numericBudget = Number(categoryBudget);
    if (!categoryName.trim()) {
      setError("Enter a category name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.categories.create({
        name: categoryName.trim(),
        monthly_budget: numericBudget >= 0 ? toStoredUsd(numericBudget) : 0,
        icon: null,
        color: "#D97706",
      });
      setCategoryName("");
      setCategoryBudget("");
      setShowCategoryForm(false);
      await loadMetadata();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add category");
    } finally {
      setSaving(false);
    }
  }

  function openEditBudget(category: Category) {
    setBudgetCategoryId(category.id);
    setBudgetLimit(toDisplayAmount(Number(category.monthly_budget)).toFixed(2));
    setError("");
    setShowBudgetForm(true);
  }

  async function submitBudgets() {
    const numericLimit = Number(budgetLimit);
    if (!budgetCategoryId || !numericLimit || numericLimit <= 0) {
      setError("Select a category and enter a positive budget limit.");
      return;
    }
    const now = new Date();
    setSaving(true);
    setError("");
    try {
      await Promise.all([
        api.budgets.create({
          category_id: budgetCategoryId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          limit_amount: toStoredUsd(numericLimit),
        }),
        api.categories.update(budgetCategoryId, {
          monthly_budget: toStoredUsd(numericLimit),
        }),
      ]);
      setBudgetCategoryId("");
      setBudgetLimit("");
      setShowBudgetForm(false);
      await loadMetadata();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update budget");
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file: File) {
    setSaving(true);
    setError("");
    try {
      const text = await file.text();
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine
        .split(",")
        .map((item) => item.trim().toLowerCase().replace(/^"|"$/g, ""));
      let imported = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const values = line.split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
        const get = (name: string) => values[headers.indexOf(name)] ?? "";
        const numericAmount = Number(get("amount"));
        if (!numericAmount || numericAmount <= 0) continue;
        await api.transactions.create({
          type: get("type") === "income" ? "income" : "expense",
          description: get("description") || get("name") || "Imported transaction",
          amount: toStoredUsd(numericAmount),
          account_id: get("account_id") || accountId || null,
          category_id: get("category_id") || categoryId || null,
          transaction_date:
            get("date") || get("transaction_date") || transactionDate || currentLocalDate(),
          notes: get("notes") || null,
        });
        imported += 1;
      }
      setShowImportForm(false);
      await refreshAll();
      setError(imported ? "" : "No valid transactions were found in the CSV.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not import CSV");
    } finally {
      setSaving(false);
    }
  }

  function handleSwitchLayout(nextLayout: "transactions_first" | "categories_first") {
    updateExpenseLayout(nextLayout);
    void api.preferences.update({ expenseLayout: nextLayout }).catch(() => {});
  }

  const manualSortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const pinDiff = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
      if (pinDiff !== 0) return pinDiff;
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const sortedCategories = useMemo(() => {
    if (effectiveCategorySort === "manual") {
      return manualSortedCategories;
    }

    const spentByCat = new Map<string, number>();
    for (const row of monthlyTransactions) {
      if (row.type === "expense" && row.category_id) {
        spentByCat.set(
          row.category_id,
          (spentByCat.get(row.category_id) ?? 0) + Number(row.amount),
        );
      }
    }

    return [...categories].sort((a, b) => {
      const spentA = spentByCat.get(a.id) ?? 0;
      const spentB = spentByCat.get(b.id) ?? 0;
      const remA = Number(a.monthly_budget) - spentA;
      const remB = Number(b.monthly_budget) - spentB;

      switch (effectiveCategorySort) {
        case "spent_desc":
          return spentB - spentA || a.name.localeCompare(b.name);
        case "spent_asc":
          return spentA - spentB || a.name.localeCompare(b.name);
        case "remaining_desc":
          return remB - remA || a.name.localeCompare(b.name);
        case "remaining_asc":
          return remA - remB || a.name.localeCompare(b.name);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [categories, effectiveCategorySort, manualSortedCategories, monthlyTransactions]);

  async function handleCommitCategoryOrder(nextCategories: Category[]) {
    setCategories(nextCategories);
    if (effectiveCategorySort !== "manual") {
      setCategorySortOverride("manual");
    }
    setSavingOrder(true);
    try {
      await api.categories.reorder(
        nextCategories.map((c, idx) => ({
          id: c.id,
          sort_order: idx,
          is_pinned: Boolean(c.is_pinned),
        })),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save category order. Ensure database migration is applied.",
      );
    } finally {
      setSavingOrder(false);
    }
  }

  const layoutProps = {
    categories: sortedCategories,
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
    filters: effectiveFilters,
    categorySort: effectiveCategorySort,
    displayMode,
    loadMoreSentinelRef,
    onFiltersChange: handleFiltersChange,
    onResetFilters: handleResetFilters,
    onPageSizeChange: (size: 25 | 50 | 100) => {
      setPageSizeOverride(size);
      setPage(1);
    },
    onPageChange: (nextPage: number) => void fetchTransactionsPage(nextPage, false),
    onLoadMore: () => void fetchTransactionsPage(page + 1, true),
    onEditBudget: openEditBudget,
    onCategorySortChange: (sort: CategorySort) => setCategorySortOverride(sort),
    onOpenCustomize: () => setShowCustomizeSheet(true),
  };

  return (
    <Container>
      <PageHeader
        eyebrow="Cash flow"
        title="Expenses"
        description="Track spending, manage category limits and keep every account in balance."
        actions={
          <>
            <span data-tour="expenses-add-tx" className="inline-flex flex-wrap gap-2">
              <ActionButton primary onClick={() => setShowExpenseForm(true)}>
                + Add expense
              </ActionButton>
              <ActionButton onClick={() => setShowIncomeForm(true)}>+ Add income</ActionButton>
            </span>
            <span data-tour="expenses-add-category" className="inline-flex">
              <ActionButton onClick={() => setShowCategoryForm(true)}>+ Add category</ActionButton>
            </span>
            <ActionButton onClick={() => setShowImportForm(true)}>Import CSV</ActionButton>
          </>
        }
      />
      {error ? (
        <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
          {error}
        </p>
      ) : null}

      {/* View Mode Switcher */}
      <div className="mt-5 flex flex-col gap-2 border-b border-ink/12 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ink-soft dark:text-[#cfc2af]">
          View Mode
        </p>
        <div
          role="group"
          aria-label="Expense view mode"
          className="grid w-full grid-cols-2 border border-ink/15 bg-paper sm:w-auto dark:border-white/10 dark:bg-[#211b17]"
        >
          <button
            type="button"
            onClick={() => handleSwitchLayout("transactions_first")}
            className={`px-2.5 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] transition-colors sm:px-3.5 sm:py-2 sm:text-[0.6rem] sm:tracking-[0.13em] ${
              expenseLayout === "transactions_first"
                ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
            }`}
          >
            Transactions First
          </button>
          <button
            type="button"
            onClick={() => handleSwitchLayout("categories_first")}
            className={`border-l border-ink/15 px-2.5 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] transition-colors sm:px-3.5 sm:py-2 sm:text-[0.6rem] sm:tracking-[0.13em] dark:border-white/10 ${
              expenseLayout === "categories_first"
                ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
            }`}
          >
            Categories First
          </button>
        </div>
      </div>

      {expenseLayout === "categories_first" ? (
        <CategoriesFirstLayout {...layoutProps} />
      ) : (
        <TransactionsFirstLayout {...layoutProps} />
      )}

      <CategoryCustomizeSheet
        open={showCustomizeSheet}
        categories={manualSortedCategories}
        saving={savingOrder}
        onClose={() => setShowCustomizeSheet(false)}
        onCommit={(next) => void handleCommitCategoryOrder(next)}
      />

      {showExpenseForm ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowExpenseForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-2xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17] sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  New transaction
                </p>
                <h2 id="expense-dialog-title" className="mt-1 font-display text-2xl font-bold">
                  Add expense
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close expense form"
                onClick={() => setShowExpenseForm(false)}
                className="grid size-9 shrink-0 place-items-center border border-ink/15 text-xl leading-none text-ink-soft hover:border-ink hover:text-ink dark:text-[#cfc2af]"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Description
                </span>
                <input
                  autoFocus
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Groceries, rent, utilities…"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Amount
                </span>
                <div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep">
                  <span className="grid w-10 place-items-center border-r border-ink/15 text-sm text-ink-soft">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Date
                </span>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Category
                </span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep dark:bg-[#211b17]"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Account
                </span>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep dark:bg-[#211b17]"
                >
                  <option value="">No account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 dark:border-white/10 sm:px-6">
              <ActionButton onClick={() => setShowExpenseForm(false)}>Cancel</ActionButton>
              <ActionButton primary onClick={submitExpense}>
                {saving ? "Saving…" : "Add expense"}
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {showIncomeForm ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowIncomeForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="income-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  Money in
                </p>
                <h2 id="income-dialog-title" className="mt-1 font-display text-2xl font-bold">
                  Add income
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close income form"
                onClick={() => setShowIncomeForm(false)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft"
              >
                ×
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Description
                </span>
                <input
                  autoFocus
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Salary, freelance, refund…"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Amount
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Date
                </span>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Account
                </span>
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none dark:bg-[#211b17]"
                >
                  <option value="">No account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setShowIncomeForm(false)}>Cancel</ActionButton>
              <ActionButton primary onClick={submitIncome}>
                {saving ? "Saving…" : "Add income"}
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {showCategoryForm ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCategoryForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  Organization
                </p>
                <h2 id="category-dialog-title" className="mt-1 font-display text-2xl font-bold">
                  Add category
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close category form"
                onClick={() => setShowCategoryForm(false)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft"
              >
                ×
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Category name
                </span>
                <input
                  autoFocus
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Pets, gifts, childcare…"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Monthly budget
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={categoryBudget}
                  onChange={(event) => setCategoryBudget(event.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
            </div>
            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setShowCategoryForm(false)}>Cancel</ActionButton>
              <ActionButton primary onClick={submitCategory}>
                {saving ? "Saving…" : "Add category"}
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {showBudgetForm ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowBudgetForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  Monthly planning
                </p>
                <h2 id="budget-dialog-title" className="mt-1 font-display text-2xl font-bold">
                  Edit budget limits
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close budget form"
                onClick={() => setShowBudgetForm(false)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft"
              >
                ×
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Category
                </span>
                <select
                  value={budgetCategoryId}
                  onChange={(event) => setBudgetCategoryId(event.target.value)}
                  className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none dark:bg-[#211b17]"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Limit
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={budgetLimit}
                  onChange={(event) => setBudgetLimit(event.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep"
                />
              </label>
            </div>
            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setShowBudgetForm(false)}>Cancel</ActionButton>
              <ActionButton primary onClick={submitBudgets}>
                {saving ? "Saving…" : "Save limit"}
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {showImportForm ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowImportForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ember-deep">
                  CSV import
                </p>
                <h2 id="import-dialog-title" className="mt-1 font-display text-2xl font-bold">
                  Import transactions
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close CSV import"
                onClick={() => setShowImportForm(false)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft"
              >
                ×
              </button>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm leading-6 text-ink-soft">
                Use columns: <b>description, amount, type, date, category_id, account_id</b>. The
                type may be <b>expense</b> or <b>income</b>.
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importCsv(file);
                }}
                className="mt-5 block w-full border border-ink/15 px-3 py-3 text-sm file:mr-4 file:border-0 file:bg-ember-deep file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white"
              />
            </div>
            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setShowImportForm(false)}>Close</ActionButton>
            </div>
          </section>
        </div>
      ) : null}
    </Container>
  );
}
