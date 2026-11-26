"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/currency";

type DashboardData = {
  transactions: Array<{
    id: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string | null;
    transaction_date: string;
  }>;
  accounts: Array<{ id: string; name: string; type: string; balance: number }>;
  categories: Array<{ id: string; name: string; monthly_budget: number }>;
  savingsGoals: Array<{
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    monthly_contribution: number;
  }>;
  budgets: Array<{ id: string; limit_amount: number; categories: { name: string } | null }>;
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    api.dashboard(now.getMonth() + 1, now.getFullYear())
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load dashboard"));
  }, []);

  const transactions = data?.transactions ?? [];
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const saved = data?.savingsGoals.reduce((sum, goal) => sum + Number(goal.current_amount), 0) ?? 0;

  return (
    <Container>
      <PageHeader eyebrow="Monthly overview" title="Overview" description="Your live financial position, across every account and category." />
      {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}
      {!data && !error ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <section key={index} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-5 h-7 w-28" />
              </section>
            ))}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-5 w-40" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3 last:border-b-0 dark:border-white/8">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </section>
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-5 w-32" />
              <div className="mt-5 space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-10" />
                    </div>
                    <Skeleton className="mt-2 h-1.5 w-full" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Total income", income],
              ["Total expenses", expenses],
              ["Total saved", saved],
              ["Left to spend", income - expenses - saved],
            ].map(([label, value]) => (
              <section key={String(label)} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{label}</p>
                <p className="mt-4 font-display text-2xl font-bold">{formatCurrency(Number(value))}</p>
              </section>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <h2 className="font-display text-xl font-bold">Recent transactions</h2>
              {transactions.length === 0 ? (
                <p className="mt-6 text-sm text-ink-soft">No transactions recorded this month.</p>
              ) : (
                <ul className="mt-4 divide-y divide-ink/10">
                  {transactions.slice(0, 8).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-semibold">{item.description || item.type}</p>
                        <p className="mt-1 text-xs text-ink-soft">{item.transaction_date}</p>
                      </div>
                      <p className="font-bold">
                        {item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}
                        {formatCurrency(Number(item.amount))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <h2 className="font-display text-xl font-bold">Savings progress</h2>
              {data.savingsGoals.length === 0 ? (
                <p className="mt-6 text-sm text-ink-soft">No savings goals yet.</p>
              ) : (
                <ul className="mt-5 space-y-5">
                  {data.savingsGoals.map((goal) => {
                    const percent = Number(((Number(goal.current_amount) / Math.max(Number(goal.target_amount), 1)) * 100).toFixed(2));
                    return (
                      <li key={goal.id}>
                        <div className="flex justify-between text-sm">
                          <b>{goal.name}</b>
                          <span>{percent}%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-ink/10">
                          <div className="h-full bg-ember-deep" style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </Container>
  );
}
