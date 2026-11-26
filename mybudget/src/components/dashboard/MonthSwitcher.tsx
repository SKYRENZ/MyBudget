import type { BudgetMonth } from "@/lib/budget";

type MonthSwitcherProps = {
  months: BudgetMonth[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function MonthSwitcher({
  months,
  activeId,
  onSelect,
}: MonthSwitcherProps) {
  return (
    <div className="mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-ink-soft">
        Month
      </p>

      <div
        role="group"
        aria-label="Budget month"
        className="grid grid-cols-6 gap-1 sm:flex sm:gap-1.5"
      >
        {months.map((month) => {
          const active = month.id === activeId;

          return (
            <button
              key={month.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(month.id)}
              className={`border px-1 py-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-deep sm:px-3.5 sm:text-[0.65rem] ${
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 bg-paper text-ink-soft hover:border-ink/50 hover:text-ink"
              }`}
            >
              {month.short}
              <span className="sr-only"> {month.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
