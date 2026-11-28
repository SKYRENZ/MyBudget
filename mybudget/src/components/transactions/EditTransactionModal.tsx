"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getCurrencySymbol, toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Account, Category, Transaction } from "@/lib/database-types";
import { isTransactionEditable } from "@/components/transactions/TransactionActionsMenu";

type Props = {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
};

function currentLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EditTransactionModal({ transaction, categories, accounts, onClose, onSaved }: Props) {
  const editable = isTransactionEditable(transaction);

  const [description, setDescription] = useState(transaction.description ?? "");
  const [amount, setAmount] = useState(String(toDisplayAmount(Number(transaction.amount))));
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [accountId, setAccountId] = useState(transaction.account_id ?? "");
  const [transactionDate, setTransactionDate] = useState(transaction.transaction_date);
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    if (!editable) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.transactions.update(transaction.id, {
        description: description.trim() || null,
        amount: toStoredUsd(numericAmount),
        category_id: categoryId || null,
        account_id: accountId || null,
        transaction_date: transactionDate || currentLocalDate(),
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft";
  const inputClass = "mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep dark:bg-transparent";

  return (
    <div
      className="mobile-modal-backdrop fixed inset-x-0 inset-y-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
        className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-2xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17] sm:px-6">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              Edit transaction
            </p>
            <h2 id="edit-tx-title" className="mt-1 font-display text-2xl font-bold">
              {transaction.description || "Transaction"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center border border-ink/15 text-xl leading-none text-ink-soft hover:border-ink hover:text-ink dark:text-[#cfc2af]"
          >
            ×
          </button>
        </div>

        {/* Lock notice */}
        {!editable && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-800/40 dark:bg-amber-900/20 sm:px-6">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              🔒 Transaction Locked
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              This transaction is older than 7 days and can no longer be modified.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Description</span>
            <input
              autoFocus={editable}
              disabled={!editable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description…"
              className={`${inputClass} disabled:opacity-60`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Amount</span>
            <div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep">
              <span className="grid w-10 place-items-center border-r border-ink/15 text-sm text-ink-soft">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                disabled={!editable}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-60"
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>Date</span>
            <input
              type="date"
              disabled={!editable}
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={`${inputClass} disabled:opacity-60`}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Category</span>
            <select
              disabled={!editable}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep disabled:opacity-60 dark:bg-[#211b17]"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Account</span>
            <select
              disabled={!editable}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep disabled:opacity-60 dark:bg-[#211b17]"
            >
              <option value="">No account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Notes</span>
            <textarea
              disabled={!editable}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className={`${inputClass} resize-none disabled:opacity-60`}
            />
          </label>
        </div>

        {error && (
          <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 dark:border-white/10 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="border border-ink/20 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink dark:border-white/15 dark:text-[#cfc2af]"
          >
            Cancel
          </button>
          {editable && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="border-2 border-ink bg-ember-deep px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ember-deep/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
