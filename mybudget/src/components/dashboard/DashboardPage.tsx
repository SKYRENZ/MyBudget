"use client";

import { useState } from "react";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { ExpensePanel } from "@/components/dashboard/ExpensePanel";
import { IncomePanel } from "@/components/dashboard/IncomePanel";
import { MonthSwitcher } from "@/components/dashboard/MonthSwitcher";
import { MonthlySummaryPanel } from "@/components/dashboard/MonthlySummaryPanel";
import { SavingsPanel } from "@/components/dashboard/SavingsPanel";
import { SummaryGrid } from "@/components/dashboard/SummaryGrid";
import { Container } from "@/components/ui/Container";
import { initialMonths, savingsGoals, updatedLabel } from "@/content/dashboard";
import {
  addExpense,
  buildSummaryStats,
  monthTotals,
  savingsPerMonth,
  setCategorySpent,
} from "@/lib/budget";
import type { BudgetMonth } from "@/lib/budget";

export function DashboardPage() {
  const [months, setMonths] = useState<BudgetMonth[]>(initialMonths);
  const [activeMonthId, setActiveMonthId] = useState(
    initialMonths[initialMonths.length - 1].id,
  );

  const activeIndex = Math.max(
    0,
    months.findIndex((month) => month.id === activeMonthId),
  );
  const month = months[activeIndex];
  const previousMonth = activeIndex > 0 ? months[activeIndex - 1] : undefined;

  const totals = monthTotals(month);
  const savedThisMonth = savingsPerMonth(savingsGoals);
  const stats = buildSummaryStats(
    month,
    previousMonth,
    savedThisMonth,
    savingsGoals.length,
  );

  function updateMonth(next: BudgetMonth) {
    setMonths((current) =>
      current.map((entry) => (entry.id === next.id ? next : entry)),
    );
  }

  function handleAddExpense(category: string, amount: number) {
    updateMonth(addExpense(month, category, amount));
  }

  function handleEditExpense(category: string, amount: number) {
    updateMonth(setCategorySpent(month, category, amount));
  }

  return (
    <main className="flex-1 pb-12 sm:pb-16">
      <Container>
        <DashboardHeading monthLabel={month.label} updated={updatedLabel} />

        <MonthSwitcher
          months={months}
          activeId={month.id}
          onSelect={setActiveMonthId}
        />

        <SummaryGrid stats={stats} />

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          <ExpensePanel
            key={month.id}
            month={month}
            totals={totals}
            onAdd={handleAddExpense}
            onEdit={handleEditExpense}
            className="lg:col-span-2"
          />
          <SavingsPanel goals={savingsGoals} saved={savedThisMonth} />
        </div>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          <MonthlySummaryPanel
            months={months}
            activeId={month.id}
            className="lg:col-span-2"
          />
          <IncomePanel sources={month.income} total={totals.income} />
        </div>
      </Container>
    </main>
  );
}
