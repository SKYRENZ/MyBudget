"use client";

export type FinancialInsight = {
  id: string;
  tag: string;
  title: string;
  detail: string;
  tone: "neutral" | "positive" | "warning";
};

const toneStyles: Record<FinancialInsight["tone"], string> = {
  neutral: "border-l-ink dark:border-l-[#cfc2af]",
  positive: "border-l-[#7a8462]",
  warning: "border-l-ember-deep",
};

const tagStyles: Record<FinancialInsight["tone"], string> = {
  neutral: "text-ink-soft dark:text-[#cfc2af]",
  positive: "text-[#5f6948] dark:text-[#a8b48c]",
  warning: "text-ember-deep dark:text-ember-soft",
};

export function ReportsInsights({ insights }: { insights: FinancialInsight[] }) {
  return (
    <section className="mt-5 border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]">
      <div className="border-b border-ink/12 pb-4 dark:border-white/10">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Editorial briefing
        </p>
        <h2 className="mt-1 font-display text-xl font-bold">Insights</h2>
      </div>

      {insights.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
          Add transactions, budgets, or savings goals to generate tailored financial observations.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <article
              key={insight.id}
              className={`border border-ink/10 border-l-2 bg-cream/45 p-4 dark:border-white/10 dark:bg-white/[0.02] ${toneStyles[insight.tone]}`}
            >
              <p
                className={`text-[0.58rem] font-bold uppercase tracking-[0.16em] ${tagStyles[insight.tone]}`}
              >
                {insight.tag}
              </p>
              <h3 className="mt-1.5 font-display text-lg font-bold leading-snug">
                {insight.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-[#cfc2af]">
                {insight.detail}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
