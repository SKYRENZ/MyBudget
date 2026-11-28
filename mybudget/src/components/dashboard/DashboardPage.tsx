"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  MonthlyCashFlowChart,
  type DailyCashFlowPoint,
} from "@/components/dashboard/MonthlyCashFlowChart";
import { toLocalDateKey } from "@/components/reports/chart-utils";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/currency";
import { useHideAmounts, usePrivacyConfig } from "@/lib/privacy-preferences";

function getTimeGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getDisplayFirstName(fullName?: string | null, username?: string | null): string | null {
  const raw = fullName?.trim() || username?.trim() || "";
  if (!raw) return null;
  return raw.split(/\s+/)[0] || null;
}

type DashboardData = {
  transactions: Array<{
    id: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string | null;
    transaction_date: string;
    categories?: { name: string } | null;
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
  useHideAmounts();
  usePrivacyConfig();
  const [data, setData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const current = new Date();
    Promise.all([
      api.dashboard(current.getMonth() + 1, current.getFullYear()),
      api.profile.get().catch(() => null),
    ])
      .then(([dashboardData, profile]) => {
        if (cancelled) return;
        setNow(current);
        setData(dashboardData);
        setUserName(getDisplayFirstName(profile?.full_name, profile?.username));
      })
      .catch((reason) => {
        if (cancelled) return;
        setNow(current);
        setError(reason instanceof Error ? reason.message : "Could not load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const saved = data?.savingsGoals.reduce((sum, goal) => sum + Number(goal.current_amount), 0) ?? 0;

  const todayStats = useMemo(() => {
    if (!now) {
      return {
        totalSpentToday: 0,
        transactionCountToday: 0,
        largestExpense: null,
      };
    }
    const todayKey = toLocalDateKey(now);
    const todayTransactions = transactions.filter((item) => item.transaction_date === todayKey);
    const todayExpenses = todayTransactions.filter((item) => item.type === "expense");
    const totalSpentToday = todayExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const largestExpense = todayExpenses.reduce<DashboardData["transactions"][number] | null>(
      (largest, item) =>
        !largest || Number(item.amount) > Number(largest.amount) ? item : largest,
      null,
    );

    return {
      totalSpentToday,
      transactionCountToday: todayTransactions.length,
      largestExpense,
    };
  }, [now, transactions]);

  const monthlyCashFlow = useMemo<DailyCashFlowPoint[]>(() => {
    if (!now) return [];
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthLabel = now.toLocaleDateString("en-US", { month: "short" });

    const byDay = new Map<string, { income: number; expenses: number }>();
    for (const item of transactions) {
      const current = byDay.get(item.transaction_date) ?? { income: 0, expenses: 0 };
      if (item.type === "income") current.income += Number(item.amount);
      if (item.type === "expense") current.expenses += Number(item.amount);
      byDay.set(item.transaction_date, current);
    }

    const points: DailyCashFlowPoint[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const totals = byDay.get(key);
      points.push({
        day: String(day),
        label: `${monthLabel} ${day}`,
        income: totals?.income ?? 0,
        expenses: totals?.expenses ?? 0,
      });
    }
    return points;
  }, [now, transactions]);

  const greetingText = now
    ? userName
      ? `${getTimeGreeting(now)}, ${userName}.`
      : "Welcome back."
    : "";
  const monthYearLabel = now
    ? now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()
    : "";
  const fullDateLabel = now
    ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <Container>
      <header className="border-b border-ink/15 pb-6 pt-8 sm:pt-10 dark:border-white/10">
        {now ? (
          <>
            <p className="text-sm font-medium tracking-wide text-ink-soft dark:text-[#cfc2af]">
              {greetingText}
            </p>
            <div className="mt-3 flex flex-col gap-0.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-ember-deep">
                {monthYearLabel}
              </p>
              <p className="text-xs font-medium text-ink-soft dark:text-[#cfc2af]">
                {fullDateLabel}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-40" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        )}

        <h1 className="mt-4 font-display text-4xl font-bold leading-none sm:text-5xl">
          Overview
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft dark:text-[#cfc2af]">
          Your financial snapshot for this month.
        </p>
      </header>
      {error ? (
        <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
          {error}
        </p>
      ) : null}

      {!data && !error ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <section
                key={index}
                className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"
              >
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-5 h-7 w-28" />
              </section>
            ))}
          </div>

          <section className="mt-4 border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-2 h-5 w-36" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border-t border-ink/10 pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4 first:border-0 first:pt-0 first:pl-0 dark:border-white/10">
                  <Skeleton className="h-2.5 w-28" />
                  <Skeleton className="mt-3 h-6 w-24" />
                </div>
              ))}
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <Skeleton className="h-5 w-40" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 border-b border-ink/8 pb-3 last:border-b-0 dark:border-white/8"
                  >
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

          <section className="mt-5 border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-2 h-5 w-40" />
            <Skeleton className="mt-5 h-52 w-full" />
          </section>
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
              <section
                key={String(label)}
                className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"
              >
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                  {label}
                </p>
                <p className="mt-4 font-display text-2xl font-bold tabular-nums">
                  {formatCurrency(Number(value), "dashboard")}
                </p>
              </section>
            ))}
          </div>

          <section className="mt-4 border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
                  Daily pulse
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">Today&apos;s Activity</h2>
              </div>
              <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
                {now
                  ? now.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </p>
            </div>

            <div className="mt-4 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-3 dark:border-white/10">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                  Total spent today
                </p>
                <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                  {formatCurrency(todayStats.totalSpentToday, "dashboard")}
                </p>
              </div>

              <div className="border-t border-ink/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 dark:border-white/10">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                  Number of transactions today
                </p>
                <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                  {todayStats.transactionCountToday}
                </p>
              </div>

              <div className="border-t border-ink/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5 dark:border-white/10">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                  Largest expense today
                </p>
                {todayStats.largestExpense ? (
                  <>
                    <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                      {formatCurrency(Number(todayStats.largestExpense.amount), "dashboard")}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-soft dark:text-[#cfc2af]">
                      {todayStats.largestExpense.description ||
                        todayStats.largestExpense.categories?.name ||
                        "Expense"}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 font-display text-2xl font-bold text-ink-soft/70 dark:text-[#cfc2af]/70">
                    —
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-3">
            <section className="min-w-0 border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold">Recent transactions</h2>
                <Link
                  href="/expenses"
                  className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ember-deep transition-colors hover:underline"
                >
                  View All Transactions →
                </Link>
              </div>
              {transactions.length === 0 ? (
                <p className="mt-6 text-sm text-ink-soft dark:text-[#cfc2af]">
                  No transactions recorded this month.
                </p>
              ) : (
                <ul className="mt-4 min-w-0 divide-y divide-ink/10 dark:divide-white/10">
                  {transactions.slice(0, 10).map((item, index) => (
                    <li
                      key={item.id}
                      className={`flex min-w-0 items-center justify-between gap-3 py-3 ${
                        index >= 5 ? "hidden lg:flex" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {item.description || item.type}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 font-bold tabular-nums ${
                          item.type === "income"
                            ? "text-green-700 dark:text-green-400"
                            : item.type === "expense"
                              ? "text-ember-deep"
                              : ""
                        }`}
                      >
                        {item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}
                        {formatCurrency(Number(item.amount), "transactions")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <h2 className="font-display text-xl font-bold">Savings progress</h2>
              {data.savingsGoals.length === 0 ? (
                <p className="mt-6 text-sm text-ink-soft dark:text-[#cfc2af]">
                  No savings goals yet.
                </p>
              ) : (
                <ul className="mt-5 space-y-5">
                  {data.savingsGoals.map((goal) => {
                    const percent = Number(
                      (
                        (Number(goal.current_amount) / Math.max(Number(goal.target_amount), 1)) *
                        100
                      ).toFixed(2),
                    );
                    return (
                      <li key={goal.id}>
                        <div className="flex justify-between text-sm">
                          <b>{goal.name}</b>
                          <span className="tabular-nums">{percent}%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-ink/10 dark:bg-white/10">
                          <div
                            className="h-full bg-ember-deep"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section className="mt-5 border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                  Daily movement
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">Monthly Cash Flow</h2>
              </div>
              <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
                {now
                  ? now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : ""}
              </p>
            </div>
            <MonthlyCashFlowChart data={monthlyCashFlow} />
          </section>
        </>
      ) : null}
    </Container>
  );
}
