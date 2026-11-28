"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getCurrencySymbol, toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Account, Category, RecurringFrequency, RecurringTransaction, Transaction } from "@/lib/database-types";

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "daily",     label: "Daily" },
  { value: "weekly",    label: "Weekly" },
  { value: "biweekly",  label: "Bi-Weekly" },
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly" },
  { value: "custom",    label: "Custom (every N days)" },
];

function currentLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  transaction?: Transaction;
  existingRecurring?: RecurringTransaction;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
};

export function CreateRecurringModal({ transaction, existingRecurring, categories, accounts, onClose, onSaved }: Props) {
  const isEditing = Boolean(existingRecurring);
  const [name, setName] = useState(existingRecurring?.name ?? transaction?.description ?? "");
  const [txType, setTxType] = useState<"income" | "expense">(
    existingRecurring?.type ?? (transaction?.type === "income" ? "income" : "expense"),
  );
  const [amount, setAmount] = useState(
    existingRecurring
      ? String(toDisplayAmount(Number(existingRecurring.amount)))
      : transaction && Number(transaction.amount) > 0
        ? String(toDisplayAmount(Number(transaction.amount)))
        : "",
  );
  const [categoryId, setCategoryId] = useState(existingRecurring?.category_id ?? transaction?.category_id ?? "");
  const [accountId, setAccountId] = useState(existingRecurring?.account_id ?? transaction?.account_id ?? "");
  const [description, setDescription] = useState(existingRecurring?.description ?? transaction?.description ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(existingRecurring?.frequency ?? "monthly");
  const [customDays, setCustomDays] = useState(String(existingRecurring?.custom_days ?? 30));
  const [startDate, setStartDate] = useState(existingRecurring?.start_date ?? transaction?.transaction_date ?? currentLocalDate());
  const [endDate, setEndDate] = useState(existingRecurring?.end_date ?? "");
  const [neverEnds, setNeverEnds] = useState(existingRecurring ? !existingRecurring.end_date : true);
  const [autoCreate, setAutoCreate] = useState(existingRecurring?.auto_create ?? false);
  const [reminderDays, setReminderDays] = useState(String(existingRecurring?.reminder_days ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    const numericAmount = Number(amount);
    if (!name.trim()) { setError("Name is required."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError("Amount must be greater than zero."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        type: txType,
        amount: toStoredUsd(numericAmount),
        category_id: categoryId || null,
        account_id: accountId || null,
        description: description.trim() || null,
        frequency,
        custom_days: frequency === "custom" ? Number(customDays) : null,
        start_date: startDate || currentLocalDate(),
        end_date: neverEnds ? null : (endDate || null),
        auto_create: autoCreate,
        reminder_days: Number(reminderDays) || 0,
      };
      if (isEditing && existingRecurring) {
        await api.recurringTransactions.update(existingRecurring.id, payload);
      } else {
        await api.recurringTransactions.create(payload);
      }
      onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Could not ${isEditing ? "update" : "create"} recurring transaction.`);
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft";
  const inputClass = "mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep dark:border-white/15";
  const selectClass = "mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep dark:border-white/15 dark:bg-[#211b17]";

  return (
    <div
      className="mobile-modal-backdrop fixed inset-x-0 inset-y-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-modal-title"
        className="mobile-modal-panel w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-2xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
        style={{ maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17] sm:px-6">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              🔁 {isEditing ? "Edit recurring" : "New recurring"}
            </p>
            <h2 id="recurring-modal-title" className="mt-1 font-display text-2xl font-bold">
              {isEditing ? "Edit recurring transaction" : "Create recurring transaction"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center border border-ink/15 text-xl leading-none text-ink-soft hover:border-ink hover:text-ink dark:border-white/15 dark:text-[#cfc2af] dark:hover:border-white/40 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {/* Name */}
          <label className="block sm:col-span-2">
            <span className={labelClass}>Name <span className="text-ember-deep">*</span></span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spotify Subscription, Rent…"
              className={inputClass}
            />
          </label>

          {/* Type */}
          <label className="block sm:col-span-2">
            <span className={labelClass}>Type</span>
            <div className="mt-2 grid grid-cols-2 border border-ink/15 dark:border-white/15">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    txType === t
                      ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                      : "text-ink-soft hover:text-ink dark:text-[#cfc2af]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </label>

          {/* Amount */}
          <label className="block">
            <span className={labelClass}>Amount <span className="text-ember-deep">*</span></span>
            <div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep dark:border-white/15 dark:focus-within:border-ember-deep">
              <span className="grid w-10 place-items-center border-r border-ink/15 text-sm text-ink-soft dark:border-white/15 dark:text-[#cfc2af]">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              />
            </div>
          </label>

          {/* Frequency */}
          <label className="block">
            <span className={labelClass}>Frequency <span className="text-ember-deep">*</span></span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className={selectClass}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {/* Custom days */}
          {frequency === "custom" && (
            <label className="block">
              <span className={labelClass}>Every N days</span>
              <input
                type="number"
                min="1"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          {/* Category */}
          <label className="block">
            <span className={labelClass}>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
              <option value="">No category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </label>

          {/* Account */}
          <label className="block">
            <span className={labelClass}>Account</span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
              <option value="">No account</option>
              {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </label>

          {/* Description */}
          <label className="block sm:col-span-2">
            <span className={labelClass}>Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              className={inputClass}
            />
          </label>

          {/* Start date */}
          <label className="block">
            <span className={labelClass}>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </label>

          {/* End date */}
          <div className="block">
            <span className={`${labelClass} mb-2 block`}>End Date</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={neverEnds}
                onChange={(e) => setNeverEnds(e.target.checked)}
                className="accent-ember-deep"
              />
              Never ends
            </label>
            {!neverEnds && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${inputClass} mt-2`}
              />
            )}
          </div>

          {/* Options */}
          <div className="sm:col-span-2 space-y-3 border-t border-ink/10 pt-3 dark:border-white/10">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={autoCreate}
                onChange={(e) => setAutoCreate(e.target.checked)}
                className="accent-ember-deep"
              />
              <span>
                <strong>Auto-create transaction</strong>
                <span className="ml-1 text-ink-soft dark:text-[#cfc2af]">— automatically add to ledger on due date</span>
              </span>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <span className="shrink-0 text-ink-soft dark:text-[#cfc2af]">Remind</span>
              <input
                type="number"
                min="0"
                max="30"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="w-16 border border-ink/15 bg-transparent px-2 py-1 text-sm outline-none focus:border-ember-deep dark:border-white/15"
              />
              <span className="text-ink-soft dark:text-[#cfc2af]">days before due date</span>
            </label>
          </div>
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
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="border-2 border-ink bg-blue-600 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (isEditing ? "Saving…" : "Creating…") : (isEditing ? "Save changes" : "Create recurring")}
          </button>
        </div>
      </section>
    </div>
  );
}
