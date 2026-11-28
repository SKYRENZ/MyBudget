"use client";

import { api } from "@/lib/api";
import {
  updateBudgetBehavior,
  useBudgetBehavior,
  type BudgetBehavior,
} from "@/lib/app-preferences";

const OPTIONS: Array<{
  value: BudgetBehavior;
  title: string;
  badge?: string;
  description: string;
}> = [
  {
    value: "carry_forward",
    title: "Carry Budget Limits Forward",
    badge: "Recommended",
    description:
      "When a new month starts, your category budget limits carry over automatically while monthly spending resets to zero.",
  },
  {
    value: "manual",
    title: "Manual Monthly Budget Setup",
    description:
      "Start each new month with unconfigured limits until you explicitly set them for that month. Previous months remain preserved.",
  },
];

export function BudgetsSettings() {
  const budgetBehavior = useBudgetBehavior();

  function handleChange(next: BudgetBehavior) {
    updateBudgetBehavior(next);
    void api.preferences.update({ budgetBehavior: next }).catch(() => {});
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Monthly Lifecycle
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Monthly Budget Behavior</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          Choose how category budget limits behave when a new calendar month begins. Historical
          transactions, balances, savings, and past budgets are always preserved.
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Monthly Budget Behavior</legend>
          <div className="grid gap-3">
            {OPTIONS.map((opt) => {
              const selected = budgetBehavior === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(opt.value)}
                  className={`flex flex-col items-start gap-1.5 border p-4 text-left transition-colors ${
                    selected
                      ? "border-ember-deep bg-ember-deep/5 dark:border-ember-deep dark:bg-ember-deep/10"
                      : "border-ink/15 hover:border-ink/35 dark:border-white/10 dark:hover:border-white/25"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-bold dark:text-[#f7eddd]">{opt.title}</span>
                    <div className="flex items-center gap-2">
                      {opt.badge ? (
                        <span className="border border-ember-deep/30 bg-ember-deep/10 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-ember-deep">
                          {opt.badge}
                        </span>
                      ) : null}
                      <span
                        className={`grid size-4 place-items-center rounded-full border ${
                          selected
                            ? "border-ember-deep bg-ember-deep"
                            : "border-ink/30 dark:border-white/30"
                        }`}
                        aria-hidden="true"
                      >
                        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
