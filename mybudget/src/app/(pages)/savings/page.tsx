"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency, getCurrencySymbol, toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Account, FinancialGoal, SavingsGoal } from "@/lib/database-types";

type PlanningDialog = "contribution" | "savings" | "goal" | null;
type DeleteTarget =
  | { kind: "savings"; item: SavingsGoal }
  | { kind: "goal"; item: FinancialGoal }
  | null;

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialog, setDialog] = useState<PlanningDialog>(null);
  const [editingSaving, setEditingSaving] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [status, setStatus] = useState<"active" | "completed" | "archived">("active");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNotes, setContributionNotes] = useState("");

  async function loadPlanning() {
    const [savingsRows, goalRows, accountRows] = await Promise.all([
      api.savingsGoals.list(),
      api.financialGoals.list(),
      api.accounts.list(),
    ]);
    setSavings(savingsRows);
    setGoals(goalRows);
    setAccounts(accountRows);
  }

  useEffect(() => {
    Promise.all([api.savingsGoals.list(), api.financialGoals.list(), api.accounts.list()])
      .then(([savingsRows, goalRows, accountRows]) => {
        setSavings(savingsRows);
        setGoals(goalRows);
        setAccounts(accountRows);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load planning"),
      );
  }, []);

  function resetFormFields() {
    setName("");
    setDescription("");
    setTargetAmount("");
    setCurrentAmount("");
    setMonthlyContribution("");
    setTargetDate("");
    setDeadline("");
    setPriority("medium");
    setStatus("active");
    setSelectedGoalId("");
    setSelectedAccountId("");
    setContributionAmount("");
    setContributionNotes("");
    setEditingSaving(null);
    setEditingGoal(null);
  }

  function closeDialog() {
    setDialog(null);
    setError("");
    resetFormFields();
  }

  function openCreateSavings() {
    resetFormFields();
    setError("");
    setDialog("savings");
  }

  function openEditSavings(goal: SavingsGoal) {
    resetFormFields();
    setEditingSaving(goal);
    setName(goal.name);
    setTargetAmount(toDisplayAmount(Number(goal.target_amount)).toFixed(2));
    setCurrentAmount(toDisplayAmount(Number(goal.current_amount)).toFixed(2));
    setMonthlyContribution(toDisplayAmount(Number(goal.monthly_contribution)).toFixed(2));
    setTargetDate(goal.target_date ? goal.target_date.slice(0, 10) : "");
    setStatus(goal.status);
    setError("");
    setDialog("savings");
  }

  function openCreateGoal() {
    resetFormFields();
    setError("");
    setDialog("goal");
  }

  function openEditGoal(goal: FinancialGoal) {
    resetFormFields();
    setEditingGoal(goal);
    setName(goal.name);
    setDescription(goal.description ?? "");
    setTargetAmount(
      goal.target_amount !== null ? toDisplayAmount(Number(goal.target_amount)).toFixed(2) : "",
    );
    setDeadline(goal.deadline ? goal.deadline.slice(0, 10) : "");
    setPriority(goal.priority);
    setStatus(goal.status);
    setError("");
    setDialog("goal");
  }

  async function submitSavingGoal() {
    if (!name.trim() || Number(targetAmount) <= 0) {
      setError("Enter a fund name and positive target amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        target_amount: toStoredUsd(Number(targetAmount)),
        current_amount: toStoredUsd(Number(currentAmount) || 0),
        monthly_contribution: toStoredUsd(Number(monthlyContribution) || 0),
        target_date: targetDate && targetDate.trim() ? targetDate.trim() : null,
        status: editingSaving ? status : "active",
      };
      if (editingSaving) {
        await api.savingsGoals.update(editingSaving.id, payload);
      } else {
        await api.savingsGoals.create(payload);
      }
      closeDialog();
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save savings fund");
    } finally {
      setSaving(false);
    }
  }

  async function submitContribution() {
    if (!selectedGoalId || !selectedAccountId || Number(contributionAmount) <= 0) {
      setError("Select a fund or goal, choose the source account, and enter a positive contribution.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const storedAmount = toStoredUsd(Number(contributionAmount));
      const payload = {
        account_id: selectedAccountId,
        amount: storedAmount,
        notes: contributionNotes.trim() || null,
        contribution_date: new Date().toISOString().slice(0, 10),
      };
      if (selectedGoalId.startsWith("savings:")) {
        const goalId = selectedGoalId.replace("savings:", "");
        await api.savingsContributions.create({
          goal_id: goalId,
          ...payload,
        });
      } else if (selectedGoalId.startsWith("goal:")) {
        const goalId = selectedGoalId.replace("goal:", "");
        await api.financialGoals.contribute(goalId, payload);
      }
      closeDialog();
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add contribution");
    } finally {
      setSaving(false);
    }
  }

  async function submitFinancialGoal() {
    if (!name.trim() || Number(targetAmount) <= 0) {
      setError("Enter a goal name and positive target amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        target_amount: toStoredUsd(Number(targetAmount)),
        deadline: deadline && deadline.trim() ? deadline.trim() : null,
        priority,
        status: editingGoal ? status : "active",
      };
      if (editingGoal) {
        await api.financialGoals.update(editingGoal.id, payload);
      } else {
        await api.financialGoals.create(payload);
      }
      closeDialog();
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save goal");
    } finally {
      setSaving(false);
    }
  }

  async function archiveSavingGoal(goal: SavingsGoal) {
    try {
      await api.savingsGoals.update(goal.id, {
        status: goal.status === "archived" ? "active" : "archived",
      });
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update fund");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      if (deleteTarget.kind === "savings") {
        await api.savingsGoals.delete(deleteTarget.item.id);
      } else {
        await api.financialGoals.delete(deleteTarget.item.id);
      }
      setDeleteTarget(null);
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete item");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <Container>
      <PageHeader
        eyebrow="Future planning"
        title="Planning"
        description="Manage savings funds and long-term financial goals in one place."
        actions={
          <>
            <ActionButton primary onClick={() => { resetFormFields(); setDialog("contribution"); }}>Add contribution</ActionButton>
            <ActionButton onClick={openCreateSavings}>Create savings fund</ActionButton>
            <ActionButton onClick={openCreateGoal}>Create goal</ActionButton>
          </>
        }
      />

      {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}

      <section className="mt-6">
        <div className="mb-4"><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Cash reserves</p><h2 className="mt-1 font-display text-2xl font-bold">Savings funds</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savings.map((goal) => {
            const target = Number(goal.target_amount);
            const saved = Number(goal.current_amount);
            const percent = target > 0 ? Number(((saved / target) * 100).toFixed(2)) : 0;
            return (
              <article key={goal.id} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{goal.status}</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => openEditSavings(goal)} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-soft hover:text-ink dark:hover:text-white">Edit</button>
                    <button type="button" onClick={() => archiveSavingGoal(goal)} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-soft hover:text-ink dark:hover:text-white">{goal.status === "archived" ? "Restore" : "Archive"}</button>
                    <button type="button" onClick={() => setDeleteTarget({ kind: "savings", item: goal })} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-red-700 hover:text-red-900 dark:text-red-400">Delete</button>
                  </div>
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold">{goal.name}</h3>
                <p className="mt-5 text-3xl font-bold">{formatCurrency(saved)}</p>
                <p className="mt-1 text-xs text-ink-soft">of {formatCurrency(target)} · {percent}%</p>
                <div className="mt-5 h-2 bg-ink/10"><div className="h-full bg-ember-deep" style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                <div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs"><div><p className="text-ink-soft">Monthly</p><b>{formatCurrency(Number(goal.monthly_contribution))}</b></div><div className="text-right"><p className="text-ink-soft">Remaining</p><b>{formatCurrency(Math.max(target - saved, 0))}</b></div></div>
              </article>
            );
          })}
          {savings.length === 0 ? <p className="text-sm text-ink-soft">No savings funds yet.</p> : null}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4"><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Life milestones</p><h2 className="mt-1 font-display text-2xl font-bold">Long-term goals</h2></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const target = Number(goal.target_amount || 0);
            const current = Number(goal.current_amount || 0);
            const percent = target > 0 ? Number(((current / target) * 100).toFixed(2)) : 0;
            return (
            <article key={goal.id} className="border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">{goal.priority} priority</p>
                  <h3 className="mt-2 font-display text-2xl font-bold">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => openEditGoal(goal)} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-soft hover:text-ink dark:hover:text-white">Edit</button>
                  <button type="button" onClick={() => setDeleteTarget({ kind: "goal", item: goal })} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-red-700 hover:text-red-900 dark:text-red-400">Delete</button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{goal.description || "No description"}</p>
              <p className="mt-5 text-3xl font-bold">{formatCurrency(current)}</p>
              <p className="mt-1 text-xs text-ink-soft">of {formatCurrency(target)} · {percent}%</p>
              <div className="mt-5 h-2 bg-ink/10"><div className="h-full bg-ember-deep" style={{ width: `${Math.min(percent, 100)}%` }} /></div>
              <div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs"><div><p className="text-ink-soft">Deadline</p><b>{goal.deadline || "Not set"}</b></div><div className="text-right"><p className="text-ink-soft">Remaining</p><b>{formatCurrency(Math.max(target - current, 0))}</b></div></div>
            </article>
            );
          })}
          {goals.length === 0 ? <p className="text-sm text-ink-soft">No long-term goals yet.</p> : null}
        </div>
      </section>

      {dialog ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="planning-dialog-title" className="max-h-[92svh] w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Planning</p><h2 id="planning-dialog-title" className="mt-1 font-display text-2xl font-bold">{dialog === "savings" ? (editingSaving ? "Edit savings fund" : "Create savings fund") : dialog === "contribution" ? "Add contribution" : (editingGoal ? "Edit long-term goal" : "Create long-term goal")}</h2></div><button type="button" aria-label="Close planning form" onClick={closeDialog} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>

            {dialog === "contribution" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block sm:col-span-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Fund or goal</span>
                  <select value={selectedGoalId} onChange={(event) => setSelectedGoalId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]">
                    <option value="">Select fund or goal</option>
                    {savings.length > 0 ? <optgroup label="Savings funds">{savings.map((goal) => <option key={goal.id} value={`savings:${goal.id}`}>{goal.name}</option>)}</optgroup> : null}
                    {goals.length > 0 ? <optgroup label="Long-term goals">{goals.map((goal) => <option key={goal.id} value={`goal:${goal.id}`}>{goal.name}</option>)}</optgroup> : null}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">From account</span>
                  <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]">
                    <option value="">Select source account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(Number(account.balance))})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Amount ({currencySymbol})</span>
                  <input type="number" min="0.01" step="0.01" value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Source / notes (optional)</span>
                  <input value={contributionNotes} onChange={(event) => setContributionNotes(event.target.value)} placeholder="e.g. Salary, Bonus" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" />
                </label>
              </div>
            ) : dialog === "goal" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Goal name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target amount ({currencySymbol})</span><input type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Deadline</span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className={`block ${editingGoal ? "" : "sm:col-span-2"}`}><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
                {editingGoal ? (
                  <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as "active" | "completed" | "archived")} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Fund name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target amount ({currencySymbol})</span><input type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Current amount ({currencySymbol})</span><input type="number" min="0" step="0.01" value={currentAmount} onChange={(event) => setCurrentAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Monthly contribution ({currencySymbol})</span><input type="number" min="0" step="0.01" value={monthlyContribution} onChange={(event) => setMonthlyContribution(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label>
                {editingSaving ? (
                  <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as "active" | "completed" | "archived")} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
                ) : null}
              </div>
            )}

            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={closeDialog}>Cancel</ActionButton><ActionButton primary onClick={dialog === "contribution" ? submitContribution : dialog === "goal" ? submitFinancialGoal : submitSavingGoal}>{saving ? "Saving…" : dialog === "contribution" ? "Add contribution" : (editingSaving || editingGoal) ? "Save changes" : "Save"}</ActionButton></div>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setDeleteTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" className="w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-md sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="border-b border-ink/15 px-5 py-4 sm:px-6">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-red-700 dark:text-red-400">Confirm deletion</p>
              <h2 id="delete-confirm-title" className="mt-1 font-display text-2xl font-bold">
                Delete {deleteTarget.kind === "savings" ? "savings fund" : "goal"}?
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-ink-soft">
                Are you sure you want to permanently delete <b className="text-ink dark:text-white">{deleteTarget.item.name}</b>?
                {deleteTarget.kind === "savings" ? " Any recorded contributions for this fund will also be removed." : ""} This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6">
              <ActionButton onClick={() => setDeleteTarget(null)}>Cancel</ActionButton>
              <button
                type="button"
                onClick={confirmDelete}
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
