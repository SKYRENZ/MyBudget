import { Panel } from "@/components/ui/Panel";
import type { IncomeSource } from "@/lib/budget";
import { formatCurrency } from "@/lib/currency";

type IncomePanelProps = {
  sources: IncomeSource[];
  total: number;
  className?: string;
};

export function IncomePanel({
  sources,
  total,
  className = "",
}: IncomePanelProps) {
  return (
    <Panel
      title="Money in"
      eyebrow="Income"
      className={className}
      action={
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </p>
      }
    >
      <ul className="flex flex-col">
        {sources.map((source) => (
          <li
            key={source.name}
            className="flex items-start justify-between gap-4 border-b border-ink/10 py-3.5 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {source.name}
              </p>
              <p className="mt-0.5 text-[0.7rem] leading-snug text-ink-soft">
                {source.cadence}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
              {formatCurrency(source.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-ink/15 pt-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
          Total income
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {formatCurrency(total)}
        </span>
      </div>
    </Panel>
  );
}
