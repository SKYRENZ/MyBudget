import { formatCurrency, formatPercent } from "@/lib/currency";

export type StatTone = "positive" | "negative" | "neutral";

export type SummaryStat = {
  label: string;
  value: number;
  note: string;
  tone: StatTone;
  highlight?: boolean;
};

export type IncomeSource = {
  name: string;
  cadence: string;
  amount: number;
};

export type ExpenseCategory = {
  name: string;
  spent: number;
  budget: number;
};

export type SavingsGoal = {
  name: string;
  saved: number;
  target: number;
  monthly: number;
};

export type BudgetMonth = {
  id: string;
  name: string;
  label: string;
  short: string;
  income: IncomeSource[];
  categories: ExpenseCategory[];
};

export type MonthTotals = {
  income: number;
  spent: number;
  budget: number;
  left: number;
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function monthTotals(month: BudgetMonth): MonthTotals {
  const income = sum(month.income.map((source) => source.amount));
  const spent = sum(month.categories.map((category) => category.spent));
  const budget = sum(month.categories.map((category) => category.budget));

  return { income, spent, budget, left: budget - spent };
}

export function savingsPerMonth(goals: SavingsGoal[]) {
  return sum(goals.map((goal) => goal.monthly));
}

export function addExpense(
  month: BudgetMonth,
  categoryName: string,
  amount: number,
): BudgetMonth {
  return {
    ...month,
    categories: month.categories.map((category) =>
      category.name === categoryName
        ? { ...category, spent: category.spent + amount }
        : category,
    ),
  };
}

export function setCategorySpent(
  month: BudgetMonth,
  categoryName: string,
  amount: number,
): BudgetMonth {
  return {
    ...month,
    categories: month.categories.map((category) =>
      category.name === categoryName
        ? { ...category, spent: Math.max(0, amount) }
        : category,
    ),
  };
}

function changeNote(current: number, previous: number, previousName: string) {
  if (previous === 0) return `No ${previousName} spending to compare`;

  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 0.05) return `Level with ${previousName}`;

  const sign = change > 0 ? "+" : "−";

  return `${sign}${Math.abs(change).toFixed(1)}% vs ${previousName}`;
}

function trendTone(delta: number, higherIsBetter: boolean): StatTone {
  if (delta === 0) return "neutral";

  return delta > 0 === higherIsBetter ? "positive" : "negative";
}

export function buildSummaryStats(
  month: BudgetMonth,
  previous: BudgetMonth | undefined,
  savedThisMonth: number,
  savingsGoalCount: number,
): SummaryStat[] {
  const current = monthTotals(month);
  const prior = previous ? monthTotals(previous) : undefined;

  return [
    {
      label: "Income",
      value: current.income,
      note:
        previous && prior
          ? changeNote(current.income, prior.income, previous.name)
          : "First month on record",
      tone:
        previous && prior
          ? trendTone(current.income - prior.income, true)
          : "neutral",
    },
    {
      label: "Expenses",
      value: current.spent,
      note:
        previous && prior
          ? changeNote(current.spent, prior.spent, previous.name)
          : "First month on record",
      tone:
        previous && prior
          ? trendTone(current.spent - prior.spent, false)
          : "neutral",
    },
    {
      label: "Saved",
      value: savedThisMonth,
      note: `${formatPercent(savedThisMonth, current.income)} of income · ${savingsGoalCount} goals`,
      tone: "neutral",
    },
    {
      label: "Left to spend",
      value: current.left,
      note: `of ${formatCurrency(current.budget)} planned`,
      tone: "neutral",
      highlight: true,
    },
  ];
}
