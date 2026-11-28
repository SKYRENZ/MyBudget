export const BACKUP_SCHEMA_VERSION = "1.0";
export const SUPPORTED_BACKUP_VERSIONS = ["1.0"] as const;

export type RestoreMode = "merge" | "replace";
export type ConflictStrategy = "skip" | "merge" | "rename";

export type BackupAccount = {
  id: string;
  user_id?: string;
  name: string;
  type: "cash" | "bank" | "savings" | "credit_card" | "gcash" | "maya" | "other";
  balance: number | string;
  color?: string | null;
  created_at?: string;
};

export type BackupCategory = {
  id: string;
  user_id?: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  monthly_budget: number | string;
  sort_order?: number;
  is_pinned?: boolean;
  created_at?: string;
};

export type BackupTransaction = {
  id: string;
  user_id?: string;
  account_id?: string | null;
  category_id?: string | null;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  description?: string | null;
  notes?: string | null;
  transaction_date: string;
  created_at?: string;
  recurring_transaction_id?: string | null;
  is_auto_generated?: boolean;
};

export type BackupBudget = {
  id?: string;
  user_id?: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number | string;
  created_at?: string;
};

export type BackupSavingsGoal = {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  monthly_contribution?: number | string;
  target_date?: string | null;
  status?: "active" | "completed" | "archived";
  created_at?: string;
};

export type BackupSavingsContribution = {
  id?: string;
  goal_id: string;
  amount: number | string;
  notes?: string | null;
  contribution_date: string;
  created_at?: string;
};

export type BackupFinancialGoal = {
  id: string;
  user_id?: string;
  name: string;
  description?: string | null;
  target_amount?: number | string | null;
  current_amount?: number | string;
  deadline?: string | null;
  priority?: "low" | "medium" | "high";
  status?: "active" | "completed" | "archived";
  created_at?: string;
};

export type BackupRecurringTransaction = {
  id: string;
  user_id?: string;
  name: string;
  type: "income" | "expense";
  amount: number | string;
  category_id?: string | null;
  account_id?: string | null;
  description?: string | null;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "custom";
  custom_days?: number | null;
  start_date: string;
  end_date?: string | null;
  next_occurrence?: string | null;
  last_generated_at?: string | null;
  auto_create?: boolean;
  reminder_days?: number;
  status?: "active" | "paused" | "completed";
  created_at?: string;
  updated_at?: string;
};

export type BackupSettings = {
  preferences?: Record<string, unknown>;
  privacy?: {
    hide_amounts?: boolean;
    hide_dashboard?: boolean;
    hide_category_budgets?: boolean;
    hide_transactions?: boolean;
    hide_accounts?: boolean;
    hide_goals_savings?: boolean;
    hide_reports?: boolean;
  };
  local_settings?: {
    theme?: string;
    compactMode?: boolean;
    fontScale?: string;
    currency?: string;
    usdToPhp?: number;
    reportSettings?: Record<string, unknown>;
  };
};

export type MyBudgetBackup = {
  version: string;
  exported_at: string;
  user: {
    username?: string | null;
    full_name?: string | null;
  };
  accounts: BackupAccount[];
  categories: BackupCategory[];
  transactions: BackupTransaction[];
  budgets: BackupBudget[];
  savings_goals: BackupSavingsGoal[];
  savings_contributions?: BackupSavingsContribution[];
  financial_goals: BackupFinancialGoal[];
  recurring_transactions: BackupRecurringTransaction[];
  settings: BackupSettings;
};

export type BackupSummary = {
  version: string;
  exportedAt: string;
  accountsCount: number;
  categoriesCount: number;
  transactionsCount: number;
  budgetsCount: number;
  savingsGoalsCount: number;
  savingsContributionsCount: number;
  financialGoalsCount: number;
  recurringTransactionsCount: number;
  hasPreferences: boolean;
};

export type BackupValidationResult =
  | { valid: true; backup: MyBudgetBackup; summary: BackupSummary }
  | { valid: false; error: string };

const SENSITIVE_KEYS = new Set([
  "password",
  "access_token",
  "refresh_token",
  "session",
  "supabase_key",
  "service_role_key",
  "secret_key",
]);

function containsSensitiveKeys(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) return true;
  }
  return false;
}

export function validateBackupPayload(raw: unknown): BackupValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, error: "Invalid backup file: expected a JSON object." };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.version !== "string" || !obj.version.trim()) {
    return { valid: false, error: "Missing backup schema version." };
  }

  if (!SUPPORTED_BACKUP_VERSIONS.includes(obj.version as (typeof SUPPORTED_BACKUP_VERSIONS)[number])) {
    return {
      valid: false,
      error: `Unsupported backup version "${obj.version}". Supported versions: ${SUPPORTED_BACKUP_VERSIONS.join(", ")}.`,
    };
  }

  if (typeof obj.exported_at !== "string" || Number.isNaN(Date.parse(obj.exported_at))) {
    return { valid: false, error: "Missing or invalid exported_at timestamp." };
  }

  const requiredArrays = [
    "accounts",
    "categories",
    "transactions",
    "budgets",
    "savings_goals",
    "financial_goals",
    "recurring_transactions",
  ] as const;

  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      return {
        valid: false,
        error: `Corrupted backup: "${key}" must be an array.`,
      };
    }
  }

  if (obj.savings_contributions !== undefined && !Array.isArray(obj.savings_contributions)) {
    return {
      valid: false,
      error: 'Corrupted backup: "savings_contributions" must be an array.',
    };
  }

  if (obj.user !== undefined && (typeof obj.user !== "object" || obj.user === null || Array.isArray(obj.user))) {
    return { valid: false, error: 'Corrupted backup: "user" must be an object.' };
  }

  if (obj.settings !== undefined && (typeof obj.settings !== "object" || obj.settings === null || Array.isArray(obj.settings))) {
    return { valid: false, error: 'Corrupted backup: "settings" must be an object.' };
  }

  if (containsSensitiveKeys(obj.user)) {
    return { valid: false, error: "Backup contains disallowed credential fields." };
  }

  const accounts = obj.accounts as BackupAccount[];
  const categories = obj.categories as BackupCategory[];
  const transactions = obj.transactions as BackupTransaction[];
  const budgets = obj.budgets as BackupBudget[];
  const savingsGoals = obj.savings_goals as BackupSavingsGoal[];
  const savingsContributions = (obj.savings_contributions ?? []) as BackupSavingsContribution[];
  const financialGoals = obj.financial_goals as BackupFinancialGoal[];
  const recurringTransactions = obj.recurring_transactions as BackupRecurringTransaction[];

  // Spot-check critical required fields in records
  for (const acc of accounts) {
    if (!acc || typeof acc.name !== "string" || typeof acc.type !== "string") {
      return { valid: false, error: "Corrupted backup: account record is missing name or type." };
    }
  }

  for (const cat of categories) {
    if (!cat || typeof cat.name !== "string") {
      return { valid: false, error: "Corrupted backup: category record is missing name." };
    }
  }

  for (const tx of transactions) {
    if (
      !tx ||
      (tx.type !== "income" && tx.type !== "expense" && tx.type !== "transfer") ||
      typeof tx.transaction_date !== "string" ||
      Number.isNaN(Number(tx.amount))
    ) {
      return { valid: false, error: "Corrupted backup: transaction record has invalid type, date, or amount." };
    }
  }

  const settings = (obj.settings ?? {}) as BackupSettings;
  const hasPreferences =
    Boolean(settings.preferences && Object.keys(settings.preferences).length > 0) ||
    Boolean(settings.privacy && Object.keys(settings.privacy).length > 0) ||
    Boolean(settings.local_settings && Object.keys(settings.local_settings).length > 0);

  const backup: MyBudgetBackup = {
    version: obj.version,
    exported_at: obj.exported_at,
    user: (obj.user ?? {}) as MyBudgetBackup["user"],
    accounts,
    categories,
    transactions,
    budgets,
    savings_goals: savingsGoals,
    savings_contributions: savingsContributions,
    financial_goals: financialGoals,
    recurring_transactions: recurringTransactions,
    settings,
  };

  return {
    valid: true,
    backup,
    summary: {
      version: backup.version,
      exportedAt: backup.exported_at,
      accountsCount: accounts.length,
      categoriesCount: categories.length,
      transactionsCount: transactions.length,
      budgetsCount: budgets.length,
      savingsGoalsCount: savingsGoals.length,
      savingsContributionsCount: savingsContributions.length,
      financialGoalsCount: financialGoals.length,
      recurringTransactionsCount: recurringTransactions.length,
      hasPreferences,
    },
  };
}
