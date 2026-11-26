import type { SummaryStat } from "@/lib/budget";
import { formatCurrency } from "@/lib/currency";

const toneClasses = {
  positive: "text-ember-deep",
  negative: "text-ink",
  neutral: "text-ink-soft",
} as const;

const dotClasses = {
  positive: "bg-ember-deep",
  negative: "bg-ink",
  neutral: "bg-ink/30",
} as const;

export function StatCard({ stat }: { stat: SummaryStat }) {
  const highlighted = stat.highlight === true;

  return (
    <div
      className={`flex flex-col justify-between border p-4 sm:p-6 ${
        highlighted
          ? "border-ink bg-ember shadow-[5px_5px_0_0_var(--color-ink)]"
          : "border-ink/15 bg-paper"
      }`}
    >
      <p
        className={`text-[0.62rem] font-bold uppercase tracking-[0.24em] ${
          highlighted ? "text-ink/80" : "text-ink-soft"
        }`}
      >
        {stat.label}
      </p>

      <p className="mt-3 font-display text-[clamp(1.35rem,3.4vw,2.15rem)] font-black leading-none tabular-nums text-ink sm:mt-4">
        {formatCurrency(stat.value)}
      </p>

      <p
        className={`mt-3 flex items-center gap-2 text-[0.7rem] leading-snug sm:text-xs ${
          highlighted ? "text-ink/75" : toneClasses[stat.tone]
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            highlighted ? "bg-ink/60" : dotClasses[stat.tone]
          }`}
        />
        {stat.note}
      </p>
    </div>
  );
}
