import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SavingsGoal } from "@/lib/budget";
import { formatCurrency, formatPercent } from "@/lib/currency";

type SavingsPanelProps = {
  goals: SavingsGoal[];
  saved: number;
  className?: string;
};

export function SavingsPanel({
  goals,
  saved,
  className = "",
}: SavingsPanelProps) {
  return (
    <Panel
      title="Savings goals"
      eyebrow="Savings"
      className={className}
      action={
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {formatCurrency(saved)} this month
        </p>
      }
    >
      <ul className="flex flex-col gap-5">
        {goals.map((goal) => (
          <li key={goal.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-semibold text-ink">
                {goal.name}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ember-deep">
                {formatPercent(goal.saved, goal.target)}
              </span>
            </div>

            <ProgressBar
              className="mt-2"
              label={`${goal.name} progress`}
              value={goal.saved}
              max={goal.target}
              tone="ink"
            />

            <p className="mt-1.5 text-[0.7rem] tabular-nums text-ink-soft">
              {formatCurrency(goal.saved)} of {formatCurrency(goal.target)}
              <span className="text-ink-soft/70">
                {" "}
                · +{formatCurrency(goal.monthly)}/mo
              </span>
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-ink/15 pt-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
          Set aside each month
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {formatCurrency(saved)}
        </span>
      </div>
    </Panel>
  );
}
