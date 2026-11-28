"use client";

import { useEffect, useRef } from "react";
import { X, Lock, Repeat, Pencil, Trash2, RefreshCw } from "lucide-react";
import type { Account, Category, Transaction } from "@/lib/database-types";
import { formatCurrency } from "@/lib/currency";
import { formatDisplayDate, useDateFormat } from "@/lib/app-preferences";
import { isTransactionEditable } from "@/components/transactions/TransactionActionsMenu";

type Props = {
  transaction: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onCreateRecurring: (tx: Transaction) => void;
};

export function TransactionDetailCard({
  transaction,
  onClose,
  onEdit,
  onDelete,
  onCreateRecurring,
}: Props) {
  const dateFormat = useDateFormat();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Escape key closes
  useEffect(() => {
    if (!transaction) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [transaction, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!transaction) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [transaction]);

  if (!transaction) return null;

  const editable = isTransactionEditable(transaction);
  const isRecurring = !!transaction.recurring_transaction_id;
  const isLocked = !editable;
  const catColor = transaction.categories?.color ?? null;
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  const amountSign = isIncome ? "+" : isExpense ? "\u2212" : "";
  const amountColor = isIncome
    ? "text-green-700 dark:text-green-400"
    : isExpense
      ? "text-ember-deep"
      : "text-ink";

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-70 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Transaction details"
        className="fixed inset-x-0 bottom-0 z-70 flex flex-col bg-paper dark:bg-[#211b17] sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[90vh] sm:max-w-md sm:shadow-2xl"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-ink/20 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              {transaction.type === "income" ? "Money In" : transaction.type === "expense" ? "New Transaction" : "Transfer"}
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-bold leading-tight">
              {transaction.description || (isIncome ? "Income" : "Expense")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1 text-ink-soft transition-colors hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount */}
        <div
          className="mx-5 border-l-4 pl-4 py-3"
          style={catColor ? { borderColor: catColor } : { borderColor: "transparent" }}
        >
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
            Amount
          </p>
          <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${amountColor}`}>
            {amountSign}{formatCurrency(Number(transaction.amount), "transactions")}
          </p>
        </div>

        {/* Scrollable detail rows */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <dl className="mt-4 divide-y divide-ink/10 dark:divide-white/10">
            <DetailRow label="Category" value={transaction.categories?.name ?? "Uncategorized"} dot={catColor} />
            <DetailRow label="Account" value={transaction.accounts?.name ?? "No account"} />
            <DetailRow label="Date" value={formatDisplayDate(transaction.transaction_date, dateFormat)} />
            {transaction.notes ? <DetailRow label="Notes" value={transaction.notes} /> : null}
          </dl>

          {/* Status badges */}
          {(isLocked || isRecurring) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {isLocked && (
                <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <Lock size={11} aria-hidden="true" />
                  Locked
                </span>
              )}
              {isRecurring && (
                <span className="inline-flex items-center gap-1.5 border border-ink/15 bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-[#cfc2af]">
                  <Repeat size={11} aria-hidden="true" />
                  Recurring
                </span>
              )}
            </div>
          ) : null}

          {isLocked && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              This transaction is locked — it&apos;s outside the 7-day edit window.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-ink/10 px-5 py-4 dark:border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => { onClose(); onEdit(transaction); }}
              className="flex items-center justify-center gap-2 border border-ink/15 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => { onClose(); onDelete(transaction); }}
              className="flex items-center justify-center gap-2 border border-ember-deep/40 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ember-deep transition-colors hover:bg-ember-deep/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
          {!isRecurring && (
            <button
              type="button"
              onClick={() => { onClose(); onCreateRecurring(transaction); }}
              className="mt-3 flex w-full items-center justify-center gap-2 border border-ink/15 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink dark:border-white/10 dark:text-[#cfc2af] dark:hover:text-white"
            >
              <RefreshCw size={13} />
              Create Recurring
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft dark:text-[#cfc2af]">
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold">
        {dot ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: dot }}
              aria-hidden="true"
            />
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
