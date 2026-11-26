import { Panel } from "@/components/ui/Panel";
import type { BudgetMonth } from "@/lib/budget";
import { monthTotals } from "@/lib/budget";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency";

const legend = [
  { label: "Income", className: "bg-ink" },
  { label: "Expenses", className: "bg-ember" },
];

type MonthlySummaryPanelProps = {
  months: BudgetMonth[];
  activeId: string;
  className?: string;
};

export function MonthlySummaryPanel({
  months,
  activeId,
  className = "",
}: MonthlySummaryPanelProps) {
  const rows = months.map((month) => {
    const totals = monthTotals(month);

    return {
      id: month.id,
      label: month.label,
      short: month.short,
      income: totals.income,
      expenses: totals.spent,
      net: totals.income - totals.spent,
      current: month.id === activeId,
    };
  });

  const max = Math.max(
    1,
    ...rows.map((row) => Math.max(row.income, row.expenses)),
  );

  const averageNet = Math.round(
    rows.reduce((total, row) => total + row.net, 0) / rows.length,
  );

  return (
    <Panel
      title="Six months of flow"
      eyebrow="Monthly summary"
      className={className}
      action={
        <ul className="flex items-center gap-4">
          {legend.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-soft"
            >
              <span aria-hidden="true" className={`h-2 w-2 ${item.className}`} />
              {item.label}
            </li>
          ))}
        </ul>
      }
    >
      <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-x-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col">
            <span
              className={`text-[0.6rem] font-bold uppercase tracking-[0.18em] ${
                row.current ? "text-ember-deep" : "text-ink-soft"
              }`}
            >
              {row.short}
            </span>

            <div
              aria-hidden="true"
              className="mt-2 flex h-28 items-end gap-1 sm:h-36"
            >
              <span
                className="w-full rounded-t-xs bg-ink"
                style={{ height: `${Math.round((row.income / max) * 100)}%` }}
              />
              <span
                className="w-full rounded-t-xs bg-ember"
                style={{ height: `${Math.round((row.expenses / max) * 100)}%` }}
              />
            </div>

            <span className="mt-2 text-[0.65rem] font-semibold tabular-nums text-ink">
              {formatCompactCurrency(row.net)}
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-ink-soft/80">
              net
            </span>

            <span className="sr-only">
              {`${row.label}: income ${formatCurrency(row.income)}, expenses ${formatCurrency(row.expenses)}, net ${formatCurrency(row.net)}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-ink/15 pt-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
          Average kept per month
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {formatCurrency(averageNet)}
        </span>
      </div>
    </Panel>
  );
}
