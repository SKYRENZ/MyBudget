"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CashFlowTrendChart,
  type MonthlyCashFlowPoint,
} from "@/components/reports/CashFlowTrendChart";
import {
  DailySpendingChart,
  type WeekdaySpendingPoint,
} from "@/components/reports/DailySpendingChart";
import {
  ExpenseBreakdownChart,
  type ExpenseSlice,
} from "@/components/reports/ExpenseBreakdownChart";
import {
  ReportsInsights,
  type FinancialInsight,
} from "@/components/reports/ReportsInsights";
import { ActionButton } from "@/components/ui/ActionButton";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { DashboardData, FinancialGoal, Transaction } from "@/lib/database-types";

type ReportsDashboardData = DashboardData & {
  budgets?: Array<{
    id: string;
    category_id: string;
    limit_amount: number | string;
    month: number;
    year: number;
    categories?: { name: string } | null;
  }>;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function ReportsPage() {
  const [data, setData] = useState<ReportsDashboardData | null>(null);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const current = new Date();
    Promise.all([
      api.dashboard() as Promise<ReportsDashboardData>,
      api.financialGoals.list().catch(() => []) as Promise<FinancialGoal[]>,
    ])
      .then(([dashboardData, goalsData]) => {
        setNow(current);
        setData(dashboardData);
        setFinancialGoals(Array.isArray(goalsData) ? goalsData : []);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load reports"),
      );
  }, []);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  const income = transactions
    .filter((row: Transaction) => row.type === "income")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = transactions
    .filter((row: Transaction) => row.type === "expense")
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const savings = Math.max(income - expenses, 0);
  const savingsRate = income > 0 ? Number(((savings / income) * 100).toFixed(2)) : 0;

  const categoryTotals = useMemo(
    () =>
      transactions
        .filter((row: Transaction) => row.type === "expense")
        .reduce<Record<string, number>>((totals, row) => {
          const name = row.categories?.name ?? "Uncategorized";
          totals[name] = (totals[name] ?? 0) + Number(row.amount);
          return totals;
        }, {}),
    [transactions],
  );

  const sortedCategories = useMemo(
    () => Object.entries(categoryTotals).sort(([, a], [, b]) => b - a),
    [categoryTotals],
  );

  const topCategories = sortedCategories.slice(0, 5);

  const sixMonthTrend = useMemo<MonthlyCashFlowPoint[]>(() => {
    if (!now) return [];
    const months: MonthlyCashFlowPoint[] = [];
    const byMonth = new Map<string, { income: number; expenses: number }>();

    for (const row of transactions) {
      const key = row.transaction_date.slice(0, 7);
      const bucket = byMonth.get(key) ?? { income: 0, expenses: 0 };
      if (row.type === "income") bucket.income += Number(row.amount);
      if (row.type === "expense") bucket.expenses += Number(row.amount);
      byMonth.set(key, bucket);
    }

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const totals = byMonth.get(monthKey) ?? { income: 0, expenses: 0 };
      months.push({
        monthKey,
        month: label,
        income: totals.income,
        expenses: totals.expenses,
        savings: Math.max(totals.income - totals.expenses, 0),
      });
    }

    return months;
  }, [now, transactions]);

  const expenseBreakdown = useMemo<ExpenseSlice[]>(() => {
    if (expenses <= 0 || sortedCategories.length === 0) return [];
    const primary = sortedCategories.slice(0, 5);
    const remainder = sortedCategories.slice(5).reduce((sum, [, val]) => sum + val, 0);
    const combined = remainder > 0 ? [...primary, ["Other", remainder] as [string, number]] : primary;

    return combined.map(([name, value]) => ({
      name,
      value,
      percent: Number(((value / expenses) * 100).toFixed(1)),
    }));
  }, [expenses, sortedCategories]);

  const weekdaySpending = useMemo<WeekdaySpendingPoint[]>(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const row of transactions) {
      if (row.type !== "expense") continue;
      const [year, month, day] = row.transaction_date.split("-").map(Number);
      if (!year || !month || !day) continue;
      const jsDay = new Date(year, month - 1, day).getDay(); // 0=Sun..6=Sat
      const mondayFirstIndex = (jsDay + 6) % 7; // 0=Mon..6=Sun
      totals[mondayFirstIndex] += Number(row.amount);
    }
    return WEEKDAY_LABELS.map((day, index) => ({
      day,
      amount: totals[index],
    }));
  }, [transactions]);

  const insights = useMemo<FinancialInsight[]>(() => {
    if (!data || !now) return [];
    const list: FinancialInsight[] = [];

    const currentMonth = sixMonthTrend[sixMonthTrend.length - 1];
    const previousMonth = sixMonthTrend[sixMonthTrend.length - 2];

    if (currentMonth && previousMonth && previousMonth.expenses > 0) {
      const diff = currentMonth.expenses - previousMonth.expenses;
      const pct = Math.abs(Math.round((diff / previousMonth.expenses) * 100));
      if (diff > 0) {
        list.push({
          id: "monthly-spending-change",
          tag: "Monthly spending",
          title: `Spending is up ${pct}% compared to ${previousMonth.month}`,
          detail: `You have spent ${formatCurrency(currentMonth.expenses)} so far in ${currentMonth.month}, up from ${formatCurrency(previousMonth.expenses)} in ${previousMonth.month}.`,
          tone: pct >= 15 ? "warning" : "neutral",
        });
      } else if (diff < 0) {
        list.push({
          id: "monthly-spending-change",
          tag: "Monthly spending",
          title: `Spending is down ${pct}% from ${previousMonth.month}`,
          detail: `Current expenses of ${formatCurrency(currentMonth.expenses)} are ${formatCurrency(Math.abs(diff))} lower than ${previousMonth.month}.`,
          tone: "positive",
        });
      } else {
        list.push({
          id: "monthly-spending-change",
          tag: "Monthly spending",
          title: `Spending is holding steady vs ${previousMonth.month}`,
          detail: `Expenses in ${currentMonth.month} match ${previousMonth.month} at ${formatCurrency(currentMonth.expenses)}.`,
          tone: "neutral",
        });
      }
    } else if (currentMonth && currentMonth.expenses > 0) {
      list.push({
        id: "monthly-spending-change",
        tag: "Monthly spending",
        title: `${formatCurrency(currentMonth.expenses)} spent in ${currentMonth.month}`,
        detail: "Once two consecutive months of expenses are recorded, month-over-month spending changes will appear here.",
        tone: "neutral",
      });
    }

    if (currentMonth && previousMonth && previousMonth.income > 0 && currentMonth.income > 0) {
      const prevRate = (previousMonth.savings / previousMonth.income) * 100;
      const currRate = (currentMonth.savings / currentMonth.income) * 100;
      const delta = Number((currRate - prevRate).toFixed(1));
      list.push({
        id: "savings-rate-change",
        tag: "Savings rate",
        title:
          delta >= 0
            ? `Savings rate improved by ${delta} percentage points`
            : `Savings rate dipped by ${Math.abs(delta)} percentage points`,
        detail: `Your savings rate moved from ${prevRate.toFixed(1)}% in ${previousMonth.month} to ${currRate.toFixed(1)}% in ${currentMonth.month}.`,
        tone: delta >= 0 ? "positive" : "warning",
      });
    } else if (income > 0) {
      list.push({
        id: "savings-rate-overall",
        tag: "Savings rate",
        title: `Overall savings rate stands at ${savingsRate}%`,
        detail:
          savingsRate >= 20
            ? "You are retaining at least 20% of recorded income after expenses."
            : "Keeping expenses below 80% of income helps build a resilient savings buffer.",
        tone: savingsRate >= 20 ? "positive" : "neutral",
      });
    }

    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthByCategoryId = new Map<string, number>();
    for (const row of transactions) {
      if (row.type !== "expense" || !row.category_id) continue;
      if (!row.transaction_date.startsWith(currentMonthPrefix)) continue;
      currentMonthByCategoryId.set(
        row.category_id,
        (currentMonthByCategoryId.get(row.category_id) ?? 0) + Number(row.amount),
      );
    }

    const budgetMap = new Map<string, number>();
    for (const cat of data.categories ?? []) {
      const limit = Number(cat.monthly_budget);
      if (limit > 0) budgetMap.set(cat.id, limit);
    }
    for (const b of data.budgets ?? []) {
      if (b.month === now.getMonth() + 1 && b.year === now.getFullYear()) {
        const limit = Number(b.limit_amount);
        if (limit > 0) budgetMap.set(b.category_id, limit);
      }
    }

    const overspentCategories = (data.categories ?? [])
      .map((cat) => {
        const limit = budgetMap.get(cat.id) ?? 0;
        const spent = currentMonthByCategoryId.get(cat.id) ?? 0;
        return { name: cat.name, limit, spent, over: spent - limit };
      })
      .filter((entry) => entry.limit > 0 && entry.over > 0)
      .sort((a, b) => b.over - a.over);

    if (overspentCategories.length > 0) {
      const topOver = overspentCategories[0];
      list.push({
        id: "overspending-warning",
        tag: "Overspending warning",
        title: `${topOver.name} exceeded its monthly budget by ${formatCurrency(topOver.over)}`,
        detail:
          overspentCategories.length > 1
            ? `${overspentCategories.length} categories are currently above their monthly limit, led by ${topOver.name} (${formatCurrency(topOver.spent)} of ${formatCurrency(topOver.limit)}).`
            : `You have spent ${formatCurrency(topOver.spent)} against a ${formatCurrency(topOver.limit)} monthly budget in ${topOver.name}.`,
        tone: "warning",
      });
    } else if (expenses > income && income > 0) {
      list.push({
        id: "overspending-warning",
        tag: "Overspending warning",
        title: `Expenses exceed income by ${formatCurrency(expenses - income)}`,
        detail: "Recorded outflows are higher than total inflows. Review discretionary categories to restore a positive surplus.",
        tone: "warning",
      });
    }

    const activeSavingsGoals = (data.savingsGoals ?? []).filter((g) => g.status === "active");
    const activeLongTermGoals = financialGoals.filter((g) => g.status === "active");
    const combinedGoals = [
      ...activeSavingsGoals.map((g) => ({
        name: g.name,
        current: Number(g.current_amount),
        target: Number(g.target_amount),
      })),
      ...activeLongTermGoals
        .filter((g) => Number(g.target_amount) > 0)
        .map((g) => ({
          name: g.name,
          current: Number(g.current_amount),
          target: Number(g.target_amount),
        })),
    ];

    if (combinedGoals.length > 0) {
      const totalCurrent = combinedGoals.reduce((sum, g) => sum + g.current, 0);
      const totalTarget = combinedGoals.reduce((sum, g) => sum + g.target, 0);
      const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;
      const closest = [...combinedGoals].sort(
        (a, b) => b.current / Math.max(b.target, 1) - a.current / Math.max(a.target, 1),
      )[0];
      const closestPct = Math.min(100, Math.round((closest.current / Math.max(closest.target, 1)) * 100));

      list.push({
        id: "goal-progress",
        tag: "Goal progress",
        title: `${closest.name} is ${closestPct}% funded`,
        detail: `Across ${combinedGoals.length} active ${combinedGoals.length === 1 ? "goal" : "goals"}, you have accumulated ${formatCurrency(totalCurrent)} toward ${formatCurrency(totalTarget)} (${overallPct}% overall).`,
        tone: closestPct >= 75 ? "positive" : "neutral",
      });
    }

    return list;
  }, [data, expenses, financialGoals, income, now, savingsRate, sixMonthTrend, transactions]);

  function exportCsv() {
    const lines = [
      ["date", "type", "description", "amount", "account", "category"],
      ...transactions.map((row) => [
        row.transaction_date,
        row.type,
        row.description ?? "",
        String(row.amount),
        row.accounts?.name ?? "",
        row.categories?.name ?? "",
      ]),
    ];
    const csv = lines
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mybudget-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Financial intelligence"
        title="Reports"
        description="Understand your patterns, compare progress and find opportunities to improve."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <ActionButton primary onClick={() => window.print()}>
              Export PDF
            </ActionButton>
            <ActionButton onClick={exportCsv}>Export CSV</ActionButton>
            <ActionButton onClick={printReport}>Print report</ActionButton>
          </div>
        }
      />

      {error ? (
        <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="mt-2 h-6 w-44" />
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="border-l-2 border-ink/20 pl-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-3 h-7 w-28" />
                </div>
                <div className="border-l-2 border-ember-deep/30 pl-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-3 h-7 w-28" />
                </div>
              </div>
            </section>
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="mt-6 h-9 w-36" />
              <Skeleton className="mt-3 h-4 w-28" />
            </section>
          </div>

          <section className="mt-5 border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="mt-2 h-6 w-44" />
            <Skeleton className="mt-6 h-64 w-full" />
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <section
                key={index}
                className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"
              >
                <Skeleton className="h-5 w-44" />
                <Skeleton className="mt-5 h-52 w-full" />
              </section>
            ))}
          </div>
        </>
      ) : null}

      {data ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                Transaction summary
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">Income and expenses</h2>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="border-l-2 border-ink pl-4 dark:border-[#f7eddd]">
                  <p className="text-xs text-ink-soft dark:text-[#cfc2af]">Income</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(income)}</p>
                </div>
                <div className="border-l-2 border-ember-deep pl-4">
                  <p className="text-xs text-ink-soft dark:text-[#cfc2af]">Expenses</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(expenses)}</p>
                </div>
              </div>
            </section>

            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                Available position
              </p>
              <p className="mt-5 text-4xl font-bold tabular-nums">{formatCurrency(savings)}</p>
              <p className="mt-2 text-sm text-ink-soft dark:text-[#cfc2af]">
                Savings rate · {savingsRate}%
              </p>
            </section>
          </div>

          <section className="mt-5 border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
                  Six-month trajectory
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">Cash Flow Trend</h2>
              </div>
              <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
                Income, expenses &amp; savings
              </p>
            </div>
            <CashFlowTrendChart data={sixMonthTrend} />
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                Category share
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">Expense Breakdown</h2>
              <ExpenseBreakdownChart data={expenseBreakdown} />
            </section>

            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                Weekly cadence
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">Daily Spending Trend</h2>
              <DailySpendingChart data={weekdaySpending} />
            </section>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <h2 className="font-display text-xl font-bold">Top spending categories</h2>
              {topCategories.length ? (
                <ul className="mt-5 space-y-4">
                  {topCategories.map(([name, amount]) => (
                    <li key={name}>
                      <div className="flex justify-between text-sm">
                        <b>{name}</b>
                        <span className="tabular-nums">{formatCurrency(amount)}</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-ink/10 dark:bg-white/10">
                        <div
                          className="h-full bg-ember-deep"
                          style={{
                            width: `${expenses ? Math.max(4, Math.round((amount / expenses) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
                  No expense categories yet.
                </p>
              )}
            </section>

            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <h2 className="font-display text-xl font-bold">Recent largest transactions</h2>
              {transactions.length ? (
                <ul className="mt-5 divide-y divide-ink/10 dark:divide-white/10">
                  {[...transactions]
                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                    .slice(0, 5)
                    .map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <b className="block truncate text-sm">{row.description || row.type}</b>
                          <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
                            {row.transaction_date}
                          </p>
                        </div>
                        <span className="shrink-0 font-bold tabular-nums">
                          {formatCurrency(Number(row.amount))}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
                  No transactions yet.
                </p>
              )}
            </section>
          </div>

          <ReportsInsights insights={insights} />

          {!transactions.length ? (
            <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
              No report transactions yet.
            </p>
          ) : null}
        </>
      ) : null}
    </Container>
  );
}
