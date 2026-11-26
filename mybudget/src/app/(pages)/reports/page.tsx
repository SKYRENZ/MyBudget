"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { DashboardData, Transaction } from "@/lib/database-types";

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load reports"));
  }, []);

  const transactions = data?.transactions ?? [];
  const income = transactions.filter((row: Transaction) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = transactions.filter((row: Transaction) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0);
  const savings = Math.max(income - expenses, 0);
  const savingsRate = income > 0 ? Number(((savings / income) * 100).toFixed(2)) : 0;

  const categoryTotals = transactions
    .filter((row: Transaction) => row.type === "expense")
    .reduce<Record<string, number>>((totals, row) => {
      const name = row.categories?.name ?? "Uncategorized";
      totals[name] = (totals[name] ?? 0) + Number(row.amount);
      return totals;
    }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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
    const csv = lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mybudget-report.csv`;
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
        actions={<><ActionButton primary onClick={() => window.print()}>Export PDF</ActionButton><ActionButton onClick={exportCsv}>Export CSV</ActionButton><ActionButton onClick={printReport}>Print report</ActionButton></>}
      />

      {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}

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
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <section key={index} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
                <Skeleton className="h-5 w-44" />
                <div className="mt-5 space-y-4">
                  {Array.from({ length: 4 }).map((__, rowIndex) => (
                    <div key={rowIndex} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3.5 w-16" />
                      </div>
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Transaction summary</p>
              <h2 className="mt-1 font-display text-xl font-bold">Income and expenses</h2>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="border-l-2 border-ink pl-4"><p className="text-xs text-ink-soft">Income</p><p className="mt-2 text-2xl font-bold">{formatCurrency(income)}</p></div>
                <div className="border-l-2 border-ember-deep pl-4"><p className="text-xs text-ink-soft">Expenses</p><p className="mt-2 text-2xl font-bold">{formatCurrency(expenses)}</p></div>
              </div>
            </section>

            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Available position</p>
              <p className="mt-5 text-4xl font-bold">{formatCurrency(savings)}</p>
              <p className="mt-2 text-sm text-ink-soft">Savings rate · {savingsRate}%</p>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><h2 className="font-display text-xl font-bold">Top spending categories</h2>{topCategories.length ? <ul className="mt-5 space-y-4">{topCategories.map(([name, amount]) => <li key={name}><div className="flex justify-between text-sm"><b>{name}</b><span>{formatCurrency(amount)}</span></div><div className="mt-2 h-1.5 bg-ink/10"><div className="h-full bg-ember-deep" style={{ width: `${expenses ? Math.max(4, Math.round(amount / expenses * 100)) : 0}%` }} /></div></li>)}</ul> : <p className="mt-5 text-sm text-ink-soft">No expense categories yet.</p>}</section>
            <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><h2 className="font-display text-xl font-bold">Recent largest transactions</h2>{transactions.length ? <ul className="mt-5 divide-y divide-ink/10">{[...transactions].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5).map((row) => <li key={row.id} className="flex items-center justify-between gap-4 py-3"><div><b className="text-sm">{row.description || row.type}</b><p className="mt-1 text-xs text-ink-soft">{row.transaction_date}</p></div><span className="font-bold">{formatCurrency(Number(row.amount))}</span></li>)}</ul> : <p className="mt-5 text-sm text-ink-soft">No transactions yet.</p>}</section>
          </div>

          {data && !transactions.length ? <p className="mt-5 text-sm text-ink-soft">No report transactions yet.</p> : null}
        </>
      )}
    </Container>
  );
}
