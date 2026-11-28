"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatDisplayDate, useDateFormat } from "@/lib/app-preferences";
import { formatCurrency } from "@/lib/currency";
import type { Transaction } from "@/lib/database-types";

type Props = {
  transaction: Transaction;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteTransactionModal({ transaction, onClose, onDeleted }: Props) {
  const dateFormat = useDateFormat();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await api.transactions.delete(transaction.id);
      onDeleted();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete transaction.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 inset-y-0 z-70 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-tx-title"
        className="w-full max-w-sm border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] dark:border-white/10 dark:bg-[#211b17]"
      >
        <div className="border-b border-ink/15 px-5 py-4 dark:border-white/10">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
            Confirm deletion
          </p>
          <h2 id="delete-tx-title" className="mt-1 font-display text-xl font-bold">
            Delete transaction?
          </h2>
        </div>

        <div className="p-5">
          <p className="text-sm text-ink-soft dark:text-[#cfc2af]">
            This will permanently remove this transaction and reverse its effect on your account balance. This cannot be undone.
          </p>
          <div className="mt-4 border border-ink/10 bg-ink/5 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="font-semibold">
              {transaction.description || (transaction.type === "income" ? "Income" : "Expense")}
            </p>
            <p className="mt-1 text-sm text-ink-soft dark:text-[#cfc2af]">
              {transaction.type === "income" ? "+" : "−"}{formatCurrency(Number(transaction.amount))}
              {" · "}{formatDisplayDate(transaction.transaction_date, dateFormat)}
            </p>
          </div>
        </div>

        {error && (
          <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="border border-ink/20 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink dark:border-white/15 dark:text-[#cfc2af]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="border-2 border-red-700 bg-red-600 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
