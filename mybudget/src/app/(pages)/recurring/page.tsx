"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Account, Category, RecurringTransaction } from "@/lib/database-types";
import { CreateRecurringModal } from "@/components/transactions/CreateRecurringModal";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  custom: "Custom",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
  paused: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
  completed: "text-ink-soft bg-ink/5 dark:text-[#cfc2af] dark:bg-white/5",
};

function RecurringCard({
  item,
  onEdit,
  onPause,
  onResume,
  onDelete,
}: {
  item: RecurringTransaction;
  onEdit: (item: RecurringTransaction) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [acting, setActing] = useState(false);

  return (
    <div className="border border-ink/15 bg-paper p-4 sm:p-5 dark:border-white/10 dark:bg-[#211b17]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold">{item.name}</h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] ${STATUS_STYLES[item.status] ?? ""}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
            {item.type === "income" ? "+" : "−"}{formatCurrency(Number(item.amount))}
            {" · "}{FREQUENCY_LABELS[item.frequency] ?? item.frequency}
            {item.categories?.name ? ` · ${item.categories.name}` : ""}
            {item.accounts?.name ? ` · ${item.accounts.name}` : ""}
          </p>
          {item.next_occurrence && (
            <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
              Next: <span className="font-semibold">{item.next_occurrence}</span>
              {item.end_date ? ` · Ends ${item.end_date}` : " · Never ends"}
            </p>
          )}
          {item.auto_create && (
            <span className="mt-1.5 inline-block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-purple-600 dark:text-purple-400">
              Auto-creates transaction
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={acting}
            onClick={() => onEdit(item)}
            className="border border-ink/20 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50 dark:border-white/15 dark:text-[#cfc2af]"
          >
            Edit
          </button>
          {item.status === "active" ? (
            <button
              type="button"
              disabled={acting}
              onClick={async () => { setActing(true); await onPause(item.id); setActing(false); }}
              className="border border-ink/20 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber-500 hover:text-amber-700 disabled:opacity-50 dark:border-white/15 dark:text-[#cfc2af]"
            >
              Pause
            </button>
          ) : item.status === "paused" ? (
            <button
              type="button"
              disabled={acting}
              onClick={async () => { setActing(true); await onResume(item.id); setActing(false); }}
              className="border border-ink/20 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-green-600 hover:text-green-700 disabled:opacity-50 dark:border-white/15 dark:text-[#cfc2af]"
            >
              Resume
            </button>
          ) : null}

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="border border-ink/20 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 dark:border-white/15 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={acting}
                onClick={async () => { setActing(true); await onDelete(item.id); setActing(false); }}
                className="border border-red-600 bg-red-600 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50"
              >
                {acting ? "…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border border-ink/20 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] dark:border-white/15"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecurringTransactionsPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "paused" | "completed" | "all">("active");

  async function loadAll() {
    setLoading(true);
    try {
      const [recurring, dashboard] = await Promise.all([
        api.recurringTransactions.list(),
        api.dashboard() as Promise<{ categories: Category[]; accounts: Account[] }>,
      ]);
      setItems(recurring);
      setCategories(dashboard.categories ?? []);
      setAccounts(dashboard.accounts ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load recurring transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.recurringTransactions.list(),
      api.dashboard() as Promise<{ categories: Category[]; accounts: Account[] }>,
    ])
      .then(([recurring, dashboard]) => {
        if (cancelled) return;
        setItems(recurring);
        setCategories(dashboard.categories ?? []);
        setAccounts(dashboard.accounts ?? []);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load recurring transactions.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePause(id: string) {
    await api.recurringTransactions.pause(id);
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "paused" } : r));
  }

  async function handleResume(id: string) {
    await api.recurringTransactions.resume(id);
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "active" } : r));
  }

  async function handleDelete(id: string) {
    await api.recurringTransactions.delete(id);
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = activeTab === "all"
    ? items
    : items.filter((r) => r.status === activeTab);

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: "active",    label: "Active" },
    { key: "paused",    label: "Paused" },
    { key: "completed", label: "Completed" },
    { key: "all",       label: "All" },
  ];

  return (
    <Container>
      <PageHeader
        eyebrow="Future planning"
        title="Planning"
        description="Manage savings funds, long-term financial goals and recurring transactions."
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-ink bg-ember-deep px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ember-deep/90"
          >
            + Add recurring
          </button>
        }
      />

      <div className="mt-5 flex gap-0 border-b border-ink/12 dark:border-white/10">
        <Link
          href="/savings"
          className="border-b-2 border-transparent px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink dark:text-[#cfc2af]"
        >
          Savings &amp; Goals
        </Link>
        <Link
          href="/recurring"
          className="border-b-2 border-ember-deep px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ember-deep"
        >
          Recurring Transactions
        </Link>
      </div>

      {error && (
        <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-0 border-b border-ink/12 dark:border-white/10">
        {tabs.map((tab) => {
          const count = tab.key === "all" ? items.length : items.filter((r) => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-ember-deep text-ember-deep"
                  : "border-transparent text-ink-soft hover:text-ink dark:text-[#cfc2af]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-5 grid gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-3 w-64" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="border border-ink/15 p-6 text-sm text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            {activeTab === "all"
              ? "No recurring transactions yet. Add one to get started."
              : `No ${activeTab} recurring transactions.`}
          </p>
        ) : (
          filtered.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={(target) => setEditingItem(target)}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Create or edit modal */}
      {(showCreateModal || editingItem) && (
        <CreateRecurringModal
          existingRecurring={editingItem ?? undefined}
          categories={categories}
          accounts={accounts}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
          }}
          onSaved={() => void loadAll()}
        />
      )}
    </Container>
  );
}
