export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: "cash" | "bank" | "savings" | "credit_card" | "gcash" | "maya" | "other";
  balance: number | string;
  color: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  monthly_budget: number | string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  description: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  accounts?: { name: string; type: string } | null;
  categories?: { name: string; color: string | null; icon: string | null } | null;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  monthly_contribution: number | string;
  target_date: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
};

export type FinancialGoal = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number | string | null;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "archived";
  created_at: string;
};

export type DashboardData = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
};
