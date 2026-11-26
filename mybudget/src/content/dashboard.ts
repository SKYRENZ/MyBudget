import type {
  BudgetMonth,
  ExpenseCategory,
  IncomeSource,
  SavingsGoal,
} from "@/lib/budget";

const CATEGORY_BUDGETS = [
  { name: "Housing", budget: 1450 },
  { name: "Groceries", budget: 560 },
  { name: "Transport", budget: 280 },
  { name: "Utilities", budget: 240 },
  { name: "Dining out", budget: 220 },
  { name: "Shopping", budget: 300 },
  { name: "Health & fitness", budget: 320 },
  { name: "Subscriptions", budget: 90 },
  { name: "Fun & hobbies", budget: 300 },
  { name: "Insurance", budget: 220 },
];

function categories(spent: number[]): ExpenseCategory[] {
  return CATEGORY_BUDGETS.map((category, index) => ({
    name: category.name,
    budget: category.budget,
    spent: spent[index] ?? 0,
  }));
}

function income(
  salary: number,
  freelance: number,
  dividends: number,
): IncomeSource[] {
  return [
    { name: "Salary", cadence: "Monthly · paid on the 27th", amount: salary },
    {
      name: "Freelance design",
      cadence: "Variable · invoices",
      amount: freelance,
    },
    { name: "Dividends", cadence: "Quarterly · payout", amount: dividends },
  ];
}

export const initialMonths: BudgetMonth[] = [
  {
    id: "2026-06",
    name: "June",
    label: "June 2026",
    short: "Jun",
    income: income(4700, 600, 120),
    categories: categories([
      1450, 542, 258, 216, 204, 446, 296, 62, 286, 220,
    ]),
  },
  {
    id: "2026-07",
    name: "July",
    label: "July 2026",
    short: "Jul",
    income: income(4700, 720, 0),
    categories: categories([
      1450, 524, 244, 232, 282, 576, 302, 62, 318, 220,
    ]),
  },
  {
    id: "2026-08",
    name: "August",
    label: "August 2026",
    short: "Aug",
    income: income(4800, 690, 120),
    categories: categories([
      1450, 498, 236, 198, 196, 254, 284, 62, 242, 220,
    ]),
  },
  {
    id: "2026-09",
    name: "September",
    label: "September 2026",
    short: "Sep",
    income: income(4800, 810, 0),
    categories: categories([
      1450, 552, 268, 226, 238, 448, 318, 62, 268, 220,
    ]),
  },
  {
    id: "2026-10",
    name: "October",
    label: "October 2026",
    short: "Oct",
    income: income(4800, 810, 120),
    categories: categories([
      1450, 512, 240, 208, 186, 264, 292, 62, 214, 206,
    ]),
  },
  {
    id: "2026-11",
    name: "November",
    label: "November 2026",
    short: "Nov",
    income: income(4800, 950, 120),
    categories: categories([
      1450, 486, 212, 194, 146, 318, 246, 62, 178, 120,
    ]),
  },
];

export const savingsGoals: SavingsGoal[] = [
  { name: "Emergency fund", saved: 6200, target: 9000, monthly: 300 },
  { name: "Japan trip", saved: 1850, target: 3000, monthly: 250 },
  { name: "New laptop", saved: 900, target: 1800, monthly: 150 },
  { name: "Home deposit", saved: 4400, target: 20000, monthly: 450 },
];

export const updatedLabel = "Updated 26 November";
