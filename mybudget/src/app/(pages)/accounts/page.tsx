"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency, getCurrencySymbol, toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Account } from "@/lib/database-types";

const accountTypes = [
  "cash",
  "bank",
  "savings",
  "credit_card",
  "gcash",
  "maya",
  "other",
] as const;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<"account" | "transfer" | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof accountTypes)[number]>("bank");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("#D97706");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");

  async function loadAccounts() {
    setAccounts(await api.accounts.list());
  }

  useEffect(() => {
    api.accounts
      .list()
      .then(setAccounts)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load accounts"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setType("bank");
    setBalance("");
    setColor("#D97706");
    setError("");
    setDialog("account");
  }

  function openEdit(account: Account) {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setBalance(toDisplayAmount(Number(account.balance)).toFixed(2));
    setColor(account.color || "#D97706");
    setError("");
    setDialog("account");
  }

  async function submitAccount() {
    if (!name.trim()) {
      setError("Enter an account name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = editing
        ? {
            name: name.trim(),
            type,
            color,
          }
        : {
            name: name.trim(),
            type,
            balance: toStoredUsd(Number(balance) || 0),
            color,
          };
      if (editing) await api.accounts.update(editing.id, body);
      else await api.accounts.create(body);
      setDialog(null);
      await loadAccounts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save account");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteAccount() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await api.accounts.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadAccounts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete account");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function submitTransfer() {
    const numericAmount = Number(amount);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || numericAmount <= 0) {
      setError("Select two different accounts and enter a positive amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.accounts.transfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: toStoredUsd(numericAmount),
        transfer_date: new Date().toISOString().slice(0, 10),
        notes: null,
      });
      setDialog(null);
      setAmount("");
      setFromAccountId("");
      setToAccountId("");
      await loadAccounts();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not transfer funds");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Money locations"
        title="Accounts"
        description="Monitor balances across banking, cash and digital wallets."
        actions={
          <>
            <span data-tour="accounts-add" className="inline-flex">
              <ActionButton primary onClick={openCreate}>
                Add account
              </ActionButton>
            </span>
            <ActionButton
              onClick={() => {
                setError("");
                setDialog("transfer");
              }}
            >
              Transfer funds
            </ActionButton>
          </>
        }
      />
      {error ? (
        <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <section
                key={index}
                className="overflow-hidden border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"
              >
                <Skeleton className="h-2 w-full" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-2.5 w-14" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="mt-8 h-8 w-36" />
                  <div className="mt-3 border-t border-ink/10 pt-3">
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </section>
            ))
          : accounts.map((account) => (
          <section
            key={account.id}
            className="overflow-hidden border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="h-2" style={{ backgroundColor: account.color || "#b85f24" }} />
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
                    {account.type.replace("_", " ")}
                  </p>
                  <h2 className="mt-2 font-display text-xl font-bold">
                    {account.name}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(account)}
                    className="text-xs text-ink-soft"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(account)}
                    className="text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-8 text-3xl font-bold">
                {formatCurrency(Number(account.balance))}
              </p>
              <p className="mt-2 border-t border-ink/10 pt-3 text-xs text-ink-soft">
                Added{" "}
                {new Date(account.created_at).toLocaleDateString()}
              </p>
            </div>
          </section>
        ))}
        {!loading && accounts.length === 0 && !error ? (
          <p className="text-sm text-ink-soft">No accounts yet.</p>
        ) : null}
      </div>

      {dialog ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-dialog-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  Money locations
                </p>
                <h2
                  id="account-dialog-title"
                  className="mt-1 font-display text-2xl font-bold"
                >
                  {dialog === "account"
                    ? editing
                      ? "Edit account"
                      : "Add account"
                    : "Transfer funds"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close account dialog"
                onClick={() => setDialog(null)}
                className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft"
              >
                ×
              </button>
            </div>

            {dialog === "account" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block sm:col-span-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Account name
                  </span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Type
                  </span>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as (typeof accountTypes)[number])}
                    className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"
                  >
                    {accountTypes.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    {editing ? "Current balance" : "Initial balance"} ({getCurrencySymbol()})
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(event) => setBalance(event.target.value)}
                    disabled={Boolean(editing)}
                    className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-ink/5 disabled:opacity-75 dark:disabled:bg-white/5"
                  />
                  {editing ? (
                    <span className="mt-1 block text-[0.62rem] text-ink-soft">
                      Balance is managed through transactions and transfers.
                    </span>
                  ) : null}
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Color
                  </span>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="mt-2 h-11 w-full border border-ink/15 bg-transparent p-1"
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    From
                  </span>
                  <select
                    value={fromAccountId}
                    onChange={(event) => setFromAccountId(event.target.value)}
                    className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    To
                  </span>
                  <select
                    value={toAccountId}
                    onChange={(event) => setToAccountId(event.target.value)}
                    className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Amount ({getCurrencySymbol()})
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm"
                  />
                </label>
              </div>
            )}

            {error ? (
              <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setDialog(null)}>Cancel</ActionButton>
              <ActionButton primary onClick={dialog === "account" ? submitAccount : submitTransfer}>
                {saving
                  ? "Saving…"
                  : dialog === "account"
                  ? editing
                    ? "Save account"
                    : "Add account"
                  : "Transfer funds"}
              </ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="mobile-modal-backdrop fixed inset-x-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="mobile-modal-panel w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-md sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="border-b border-ink/15 px-5 py-4 sm:px-6">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-red-700 dark:text-red-400">
                Confirm deletion
              </p>
              <h2 id="delete-account-title" className="mt-1 font-display text-2xl font-bold">
                Delete account?
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-ink-soft">
                Are you sure you want to permanently delete{" "}
                <b className="text-ink dark:text-white">{deleteTarget.name}</b>? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setDeleteTarget(null)}>Cancel</ActionButton>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="border border-red-700 bg-red-700 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-white transition-colors hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </Container>
  );
}
