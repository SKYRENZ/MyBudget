"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency, toStoredUsd } from "@/lib/currency";
import type { FinancialGoal, SavingsGoal } from "@/lib/database-types";

type PlanningDialog = "contribution" | "savings" | "goal" | null;

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [dialog, setDialog] = useState<PlanningDialog>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");

  async function loadPlanning() {
    const [savingsRows, goalRows] = await Promise.all([
      api.savingsGoals.list(),
      api.financialGoals.list(),
    ]);
    setSavings(savingsRows);
    setGoals(goalRows);
  }

  useEffect(() => {
    Promise.all([api.savingsGoals.list(), api.financialGoals.list()])
      .then(([savingsRows, goalRows]) => {
        setSavings(savingsRows);
        setGoals(goalRows);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load planning"),
      );
  }, []);

  function closeDialog() {
    setDialog(null);
    setError("");
  }

  async function submitSavingGoal() {
    if (!name.trim() || Number(targetAmount) <= 0) {
      setError("Enter a fund name and positive target amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.savingsGoals.create({
        name: name.trim(),
        target_amount: toStoredUsd(Number(targetAmount)),
        current_amount: toStoredUsd(Number(currentAmount) || 0),
        monthly_contribution: toStoredUsd(Number(monthlyContribution) || 0),
        target_date: targetDate || null,
        status: "active",
      });
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setMonthlyContribution("");
      setTargetDate("");
      closeDialog();
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create savings fund");
    } finally {
      setSaving(false);
    }
  }

  async function submitContribution() {
    if (!selectedGoalId || Number(contributionAmount) <= 0) {
      setError("Select a fund and enter a positive contribution.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.savingsContributions.create({
        goal_id: selectedGoalId,
        amount: toStoredUsd(Number(contributionAmount)),
        notes: null,
        contribution_date: new Date().toISOString().slice(0, 10),
      });
      setSelectedGoalId("");
      setContributionAmount("");
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
      await api.financialGoals.create({
        name: name.trim(),
        description: description.trim() || null,
        target_amount: toStoredUsd(Number(targetAmount)),
        deadline: deadline || null,
        priority,
        status: "active",
      });
      setName("");
      setDescription("");
      setTargetAmount("");
      setDeadline("");
      setPriority("medium");
      closeDialog();
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create goal");
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

  async function deleteFinancialGoal(goal: FinancialGoal) {
    try {
      await api.financialGoals.delete(goal.id);
      await loadPlanning();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete goal");
    }
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Future planning"
        title="Planning"
        description="Manage savings funds and long-term financial goals in one place."
        actions={
          <>
            <ActionButton primary onClick={() => setDialog("contribution")}>Add contribution</ActionButton>
            <ActionButton onClick={() => setDialog("savings")}>Create savings fund</ActionButton>
            <ActionButton onClick={() => setDialog("goal")}>Create goal</ActionButton>
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
            const percent = target > 0 ? Math.round((saved / target) * 100) : 0;
            return (
              <article key={goal.id} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
                <div className="flex items-start justify-between"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{goal.status}</p><button type="button" onClick={() => archiveSavingGoal(goal)} className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-soft">{goal.status === "archived" ? "Restore" : "Archive"}</button></div>
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
          {goals.map((goal) => (
            <article key={goal.id} className="border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]">
              <div className="flex items-start justify-between"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">{goal.priority} priority</p><h3 className="mt-2 font-display text-2xl font-bold">{goal.name}</h3></div><button type="button" onClick={() => deleteFinancialGoal(goal)} className="text-xs text-ink-soft">Delete</button></div>
              <p className="mt-2 text-sm text-ink-soft">{goal.description || "No description"}</p>
              <div className="mt-6 flex justify-between"><p className="text-2xl font-bold">{formatCurrency(Number(goal.target_amount || 0))}</p><p className="text-sm text-ink-soft">Target</p></div>
              <div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs"><div><p className="text-ink-soft">Deadline</p><b>{goal.deadline || "Not set"}</b></div><div className="text-right"><p className="text-ink-soft">Status</p><b>{goal.status}</b></div></div>
            </article>
          ))}
          {goals.length === 0 ? <p className="text-sm text-ink-soft">No long-term goals yet.</p> : null}
        </div>
      </section>

      {dialog ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="planning-dialog-title" className="max-h-[92svh] w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Planning</p><h2 id="planning-dialog-title" className="mt-1 font-display text-2xl font-bold">{dialog === "savings" ? "Create savings fund" : dialog === "contribution" ? "Add contribution" : "Create long-term goal"}</h2></div><button type="button" aria-label="Close planning form" onClick={closeDialog} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>

            {dialog === "contribution" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Savings fund</span><select value={selectedGoalId} onChange={(event) => setSelectedGoalId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"><option value="">Select fund</option>{savings.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></label><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Amount</span><input type="number" min="0.01" step="0.01" value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label></div>
            ) : dialog === "goal" ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Goal name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target amount</span><input type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Deadline</span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm dark:bg-[#211b17]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"><label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Fund name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target amount</span><input type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Current amount</span><input type="number" min="0" step="0.01" value={currentAmount} onChange={(event) => setCurrentAmount(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Monthly contribution</span><input type="number" min="0" step="0.01" value={monthlyContribution} onChange={(event) => setMonthlyContribution(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label><label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Target date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm" /></label></div>
            )}

            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={closeDialog}>Cancel</ActionButton><ActionButton primary onClick={dialog === "contribution" ? submitContribution : dialog === "goal" ? submitFinancialGoal : submitSavingGoal}>{saving ? "Saving…" : dialog === "contribution" ? "Add contribution" : "Save"}</ActionButton></div>
          </section>
        </div>
      ) : null}
    </Container>
  );
}
