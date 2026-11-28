import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionFromRequest } from "@/lib/auth-session";
import {
  validateBackupPayload,
  type ConflictStrategy,
  type MyBudgetBackup,
  type RestoreMode,
} from "@/lib/backup";
import {
  createAdminServerSupabase,
  createAnonServerSupabase,
  getRequestUser,
} from "@/lib/supabase-server";

const BATCH_SIZE = 250;

type RestoreCounts = {
  accounts: number;
  categories: number;
  transactions: number;
  budgets: number;
  savings_goals: number;
  savings_contributions: number;
  financial_goals: number;
  recurring_transactions: number;
};

async function insertInBatches(
  supabase: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      throw new Error(`Failed inserting into ${table}: ${error.message}`);
    }
  }
}

async function fetchAllUserTransactions(supabase: SupabaseClient, userId: string) {
  const rows: Array<{
    id: string;
    account_id: string | null;
    category_id: string | null;
    type: string;
    amount: number | string;
    description: string | null;
    transaction_date: string;
  }> = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id,account_id,category_id,type,amount,description,transaction_date")
      .eq("user_id", userId)
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

function txSignature(tx: {
  transaction_date: string;
  type: string;
  amount: number | string;
  description?: string | null;
  account_id?: string | null;
  category_id?: string | null;
}): string {
  return [
    tx.transaction_date,
    tx.type,
    Number(tx.amount).toFixed(4),
    (tx.description ?? "").trim().toLowerCase(),
    tx.account_id ?? "",
    tx.category_id ?? "",
  ].join("|");
}

function makeUniqueName(base: string, existingLower: Set<string>): string {
  let candidate = `${base} (Imported)`;
  let counter = 2;
  while (existingLower.has(candidate.toLowerCase())) {
    candidate = `${base} (Imported ${counter})`;
    counter++;
  }
  existingLower.add(candidate.toLowerCase());
  return candidate;
}

async function restoreSettings(
  request: Request,
  auth: {
    supabase: SupabaseClient;
    user: { id: string; user_metadata?: Record<string, unknown> };
  },
  backup: MyBudgetBackup,
  mode: RestoreMode,
) {
  const incomingPrefs = (backup.settings?.preferences ?? {}) as Record<string, unknown>;
  const incomingPrivacy = (backup.settings?.privacy ?? {}) as Record<string, unknown>;

  const existingPrefs = (auth.user.user_metadata?.preferences ?? {}) as Record<string, unknown>;
  const mergedPrefs =
    mode === "replace" ? incomingPrefs : { ...existingPrefs, ...incomingPrefs };

  const existingPrivacyMeta = (auth.user.user_metadata?.privacy_config ?? {}) as Record<
    string,
    unknown
  >;
  const privacyKeys = [
    "hide_dashboard",
    "hide_category_budgets",
    "hide_transactions",
    "hide_accounts",
    "hide_goals_savings",
    "hide_reports",
  ] as const;

  const privacyUpdates: Record<string, boolean> = {};
  if (typeof incomingPrivacy.hide_amounts === "boolean") {
    privacyUpdates.hide_amounts = incomingPrivacy.hide_amounts;
  }
  for (const key of privacyKeys) {
    if (typeof incomingPrivacy[key] === "boolean") {
      privacyUpdates[key] = incomingPrivacy[key] as boolean;
    }
  }

  if (Object.keys(privacyUpdates).length > 0) {
    const { error: profileErr } = await auth.supabase
      .from("profiles")
      .update(privacyUpdates)
      .eq("id", auth.user.id);
    if (profileErr && !profileErr.message?.includes("column")) {
      throw new Error(`Failed updating profile privacy settings: ${profileErr.message}`);
    }
  }

  const nextMeta = {
    ...(auth.user.user_metadata ?? {}),
    preferences: mergedPrefs,
    ...(typeof privacyUpdates.hide_amounts === "boolean"
      ? { hide_amounts: privacyUpdates.hide_amounts }
      : {}),
    privacy_config:
      mode === "replace"
        ? privacyUpdates
        : { ...existingPrivacyMeta, ...privacyUpdates },
  };

  if (process.env.SUPABASE_SECRET_KEY) {
    const admin = createAdminServerSupabase();
    await admin.auth.admin.updateUserById(auth.user.id, { user_metadata: nextMeta });
  } else {
    const cookieSession = getSessionFromRequest(request);
    if (cookieSession) {
      const client = createAnonServerSupabase();
      await client.auth.setSession({
        access_token: cookieSession.access_token,
        refresh_token: cookieSession.refresh_token,
      });
      await client.auth.updateUser({ data: nextMeta });
    }
  }

  return {
    preferences: mergedPrefs,
    privacy: privacyUpdates,
    local_settings: backup.settings?.local_settings ?? null,
  };
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    backup?: unknown;
    mode?: RestoreMode;
    conflictStrategy?: ConflictStrategy;
    confirmation?: string;
  } | null;

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid restore request body." }, { status: 400 });
  }

  const mode: RestoreMode = body.mode === "replace" ? "replace" : "merge";
  const conflictStrategy: ConflictStrategy =
    body.conflictStrategy === "merge" || body.conflictStrategy === "rename"
      ? body.conflictStrategy
      : "skip";

  if (mode === "replace" && body.confirmation?.trim() !== "RESTORE") {
    return Response.json(
      { error: 'Please type "RESTORE" to confirm replacing all existing data.' },
      { status: 400 },
    );
  }

  const validation = validateBackupPayload(body.backup);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { backup } = validation;
  const userId = auth.user.id;
  const supabase = auth.supabase;

  const restored: RestoreCounts = {
    accounts: 0,
    categories: 0,
    transactions: 0,
    budgets: 0,
    savings_goals: 0,
    savings_contributions: 0,
    financial_goals: 0,
    recurring_transactions: 0,
  };

  const skipped: RestoreCounts = {
    accounts: 0,
    categories: 0,
    transactions: 0,
    budgets: 0,
    savings_goals: 0,
    savings_contributions: 0,
    financial_goals: 0,
    recurring_transactions: 0,
  };

  try {
    const accountIdMap = new Map<string, string>();
    const categoryIdMap = new Map<string, string>();
    const recurringIdMap = new Map<string, string>();
    const savingsGoalIdMap = new Map<string, string>();

    if (mode === "replace") {
      // Delete in child-to-parent order respecting foreign keys
      const { error: delTxErr } = await supabase.from("transactions").delete().eq("user_id", userId);
      if (delTxErr) throw new Error(delTxErr.message);

      const { error: delBudgetsErr } = await supabase.from("budgets").delete().eq("user_id", userId);
      if (delBudgetsErr) throw new Error(delBudgetsErr.message);

      const { error: delRecErr } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("user_id", userId);
      if (delRecErr) throw new Error(delRecErr.message);

      // Delete savings_contributions belonging to user's savings_goals before deleting goals
      const { data: existingGoals } = await supabase
        .from("savings_goals")
        .select("id")
        .eq("user_id", userId);
      const goalIds = (existingGoals ?? []).map((g) => g.id as string);
      if (goalIds.length > 0) {
        const { error: delContribErr } = await supabase
          .from("savings_contributions")
          .delete()
          .in("goal_id", goalIds);
        if (delContribErr) throw new Error(delContribErr.message);
      }

      const { error: delSavingsErr } = await supabase
        .from("savings_goals")
        .delete()
        .eq("user_id", userId);
      if (delSavingsErr) throw new Error(delSavingsErr.message);

      const { error: delFinGoalsErr } = await supabase
        .from("financial_goals")
        .delete()
        .eq("user_id", userId);
      if (delFinGoalsErr) throw new Error(delFinGoalsErr.message);

      const { error: delCatErr } = await supabase.from("categories").delete().eq("user_id", userId);
      if (delCatErr) throw new Error(delCatErr.message);

      const { error: delAccErr } = await supabase.from("accounts").delete().eq("user_id", userId);
      if (delAccErr) throw new Error(delAccErr.message);

      // Rebuild accounts with fresh UUIDs
      const accountRows = backup.accounts.map((acc) => {
        const newId = randomUUID();
        if (acc.id) accountIdMap.set(acc.id, newId);
        return {
          id: newId,
          user_id: userId,
          name: acc.name,
          type: acc.type,
          balance: Number(acc.balance) || 0,
          color: acc.color ?? null,
          ...(acc.created_at ? { created_at: acc.created_at } : {}),
        };
      });
      if (accountRows.length > 0) {
        await insertInBatches(supabase, "accounts", accountRows);
        restored.accounts = accountRows.length;
      }

      // Rebuild categories
      const categoryRows = backup.categories.map((cat) => {
        const newId = randomUUID();
        if (cat.id) categoryIdMap.set(cat.id, newId);
        return {
          id: newId,
          user_id: userId,
          name: cat.name,
          icon: cat.icon ?? null,
          color: cat.color ?? null,
          monthly_budget: Number(cat.monthly_budget) || 0,
          sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 0,
          is_pinned: Boolean(cat.is_pinned),
          ...(cat.created_at ? { created_at: cat.created_at } : {}),
        };
      });
      if (categoryRows.length > 0) {
        await insertInBatches(supabase, "categories", categoryRows);
        restored.categories = categoryRows.length;
      }

      // Rebuild recurring_transactions
      const recurringRows = backup.recurring_transactions.map((rec) => {
        const newId = randomUUID();
        if (rec.id) recurringIdMap.set(rec.id, newId);
        return {
          id: newId,
          user_id: userId,
          name: rec.name,
          type: rec.type,
          amount: Number(rec.amount),
          category_id: rec.category_id ? (categoryIdMap.get(rec.category_id) ?? null) : null,
          account_id: rec.account_id ? (accountIdMap.get(rec.account_id) ?? null) : null,
          description: rec.description ?? null,
          frequency: rec.frequency,
          custom_days: rec.custom_days ?? null,
          start_date: rec.start_date,
          end_date: rec.end_date ?? null,
          next_occurrence: rec.next_occurrence ?? null,
          last_generated_at: rec.last_generated_at ?? null,
          auto_create: Boolean(rec.auto_create),
          reminder_days: typeof rec.reminder_days === "number" ? rec.reminder_days : 0,
          status: rec.status ?? "active",
          ...(rec.created_at ? { created_at: rec.created_at } : {}),
        };
      });
      if (recurringRows.length > 0) {
        await insertInBatches(supabase, "recurring_transactions", recurringRows);
        restored.recurring_transactions = recurringRows.length;
      }

      // Rebuild transactions (batched)
      const txRows = backup.transactions.map((tx) => ({
        id: randomUUID(),
        user_id: userId,
        account_id: tx.account_id ? (accountIdMap.get(tx.account_id) ?? null) : null,
        category_id: tx.category_id ? (categoryIdMap.get(tx.category_id) ?? null) : null,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description ?? null,
        notes: tx.notes ?? null,
        transaction_date: tx.transaction_date,
        recurring_transaction_id: tx.recurring_transaction_id
          ? (recurringIdMap.get(tx.recurring_transaction_id) ?? null)
          : null,
        is_auto_generated: Boolean(tx.is_auto_generated),
        ...(tx.created_at ? { created_at: tx.created_at } : {}),
      }));
      if (txRows.length > 0) {
        await insertInBatches(supabase, "transactions", txRows);
        restored.transactions = txRows.length;
      }

      // Rebuild budgets
      const budgetRows = backup.budgets
        .filter((b) => categoryIdMap.has(b.category_id))
        .map((b) => ({
          id: randomUUID(),
          user_id: userId,
          category_id: categoryIdMap.get(b.category_id)!,
          month: Number(b.month),
          year: Number(b.year),
          limit_amount: Number(b.limit_amount) || 0,
        }));
      if (budgetRows.length > 0) {
        await insertInBatches(supabase, "budgets", budgetRows);
        restored.budgets = budgetRows.length;
      }

      // Rebuild savings_goals
      const savingsGoalRows = backup.savings_goals.map((g) => {
        const newId = randomUUID();
        if (g.id) savingsGoalIdMap.set(g.id, newId);
        return {
          id: newId,
          user_id: userId,
          name: g.name,
          target_amount: Number(g.target_amount) || 0,
          current_amount: Number(g.current_amount) || 0,
          monthly_contribution: Number(g.monthly_contribution ?? 0) || 0,
          target_date: g.target_date ?? null,
          status: g.status ?? "active",
          ...(g.created_at ? { created_at: g.created_at } : {}),
        };
      });
      if (savingsGoalRows.length > 0) {
        await insertInBatches(supabase, "savings_goals", savingsGoalRows);
        restored.savings_goals = savingsGoalRows.length;
      }

      // Rebuild savings_contributions
      const contribRows = (backup.savings_contributions ?? [])
        .filter((c) => savingsGoalIdMap.has(c.goal_id))
        .map((c) => ({
          id: randomUUID(),
          goal_id: savingsGoalIdMap.get(c.goal_id)!,
          amount: Number(c.amount) || 0,
          notes: c.notes ?? null,
          contribution_date: c.contribution_date,
          ...(c.created_at ? { created_at: c.created_at } : {}),
        }));
      if (contribRows.length > 0) {
        await insertInBatches(supabase, "savings_contributions", contribRows);
        restored.savings_contributions = contribRows.length;
      }

      // Rebuild financial_goals
      const finGoalRows = backup.financial_goals.map((g) => ({
        id: randomUUID(),
        user_id: userId,
        name: g.name,
        description: g.description ?? null,
        target_amount: g.target_amount != null ? Number(g.target_amount) : null,
        current_amount: Number(g.current_amount ?? 0) || 0,
        deadline: g.deadline ?? null,
        priority: g.priority ?? "medium",
        status: g.status ?? "active",
        ...(g.created_at ? { created_at: g.created_at } : {}),
      }));
      if (finGoalRows.length > 0) {
        await insertInBatches(supabase, "financial_goals", finGoalRows);
        restored.financial_goals = finGoalRows.length;
      }
    } else {
      // ── MERGE MODE ──────────────────────────────────────────────────────────
      const [
        existingAccRes,
        existingCatRes,
        existingRecRes,
        existingBudgetsRes,
        existingSavingsRes,
        existingFinGoalsRes,
        existingTxs,
      ] = await Promise.all([
        supabase.from("accounts").select("id,name,type").eq("user_id", userId),
        supabase.from("categories").select("id,name").eq("user_id", userId),
        supabase
          .from("recurring_transactions")
          .select("id,name,type,amount,frequency")
          .eq("user_id", userId),
        supabase.from("budgets").select("id,category_id,month,year").eq("user_id", userId),
        supabase.from("savings_goals").select("id,name").eq("user_id", userId),
        supabase.from("financial_goals").select("id,name").eq("user_id", userId),
        fetchAllUserTransactions(supabase, userId),
      ]);

      // 1. Accounts
      const existingAccMap = new Map<string, string>();
      const existingAccNames = new Set<string>();
      for (const a of existingAccRes.data ?? []) {
        existingAccMap.set(`${String(a.name).trim().toLowerCase()}|${a.type}`, a.id as string);
        existingAccNames.add(String(a.name).trim().toLowerCase());
      }

      const accountsToInsert: Array<Record<string, unknown>> = [];
      for (const acc of backup.accounts) {
        const key = `${acc.name.trim().toLowerCase()}|${acc.type}`;
        const existingId = existingAccMap.get(key);
        if (existingId) {
          if (conflictStrategy === "skip") {
            if (acc.id) accountIdMap.set(acc.id, existingId);
            skipped.accounts++;
          } else if (conflictStrategy === "merge") {
            await supabase
              .from("accounts")
              .update({
                balance: Number(acc.balance) || 0,
                color: acc.color ?? null,
              })
              .eq("id", existingId)
              .eq("user_id", userId);
            if (acc.id) accountIdMap.set(acc.id, existingId);
            restored.accounts++;
          } else {
            const newId = randomUUID();
            const newName = makeUniqueName(acc.name, existingAccNames);
            if (acc.id) accountIdMap.set(acc.id, newId);
            accountsToInsert.push({
              id: newId,
              user_id: userId,
              name: newName,
              type: acc.type,
              balance: Number(acc.balance) || 0,
              color: acc.color ?? null,
            });
          }
        } else {
          const newId = randomUUID();
          if (acc.id) accountIdMap.set(acc.id, newId);
          existingAccMap.set(key, newId);
          existingAccNames.add(acc.name.trim().toLowerCase());
          accountsToInsert.push({
            id: newId,
            user_id: userId,
            name: acc.name,
            type: acc.type,
            balance: Number(acc.balance) || 0,
            color: acc.color ?? null,
          });
        }
      }
      if (accountsToInsert.length > 0) {
        await insertInBatches(supabase, "accounts", accountsToInsert);
        restored.accounts += accountsToInsert.length;
      }

      // 2. Categories
      const existingCatMap = new Map<string, string>();
      const existingCatNames = new Set<string>();
      for (const c of existingCatRes.data ?? []) {
        const lower = String(c.name).trim().toLowerCase();
        existingCatMap.set(lower, c.id as string);
        existingCatNames.add(lower);
      }

      const categoriesToInsert: Array<Record<string, unknown>> = [];
      for (const cat of backup.categories) {
        const lower = cat.name.trim().toLowerCase();
        const existingId = existingCatMap.get(lower);
        if (existingId) {
          if (conflictStrategy === "skip") {
            if (cat.id) categoryIdMap.set(cat.id, existingId);
            skipped.categories++;
          } else if (conflictStrategy === "merge") {
            await supabase
              .from("categories")
              .update({
                icon: cat.icon ?? null,
                color: cat.color ?? null,
                monthly_budget: Number(cat.monthly_budget) || 0,
                sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 0,
                is_pinned: Boolean(cat.is_pinned),
              })
              .eq("id", existingId)
              .eq("user_id", userId);
            if (cat.id) categoryIdMap.set(cat.id, existingId);
            restored.categories++;
          } else {
            const newId = randomUUID();
            const newName = makeUniqueName(cat.name, existingCatNames);
            if (cat.id) categoryIdMap.set(cat.id, newId);
            categoriesToInsert.push({
              id: newId,
              user_id: userId,
              name: newName,
              icon: cat.icon ?? null,
              color: cat.color ?? null,
              monthly_budget: Number(cat.monthly_budget) || 0,
              sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 0,
              is_pinned: Boolean(cat.is_pinned),
            });
          }
        } else {
          const newId = randomUUID();
          if (cat.id) categoryIdMap.set(cat.id, newId);
          existingCatMap.set(lower, newId);
          existingCatNames.add(lower);
          categoriesToInsert.push({
            id: newId,
            user_id: userId,
            name: cat.name,
            icon: cat.icon ?? null,
            color: cat.color ?? null,
            monthly_budget: Number(cat.monthly_budget) || 0,
            sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 0,
            is_pinned: Boolean(cat.is_pinned),
          });
        }
      }
      if (categoriesToInsert.length > 0) {
        await insertInBatches(supabase, "categories", categoriesToInsert);
        restored.categories += categoriesToInsert.length;
      }

      // 3. Recurring Transactions
      const existingRecMap = new Map<string, string>();
      const existingRecNames = new Set<string>();
      for (const r of existingRecRes.data ?? []) {
        const key = `${String(r.name).trim().toLowerCase()}|${r.type}|${Number(r.amount).toFixed(4)}|${r.frequency}`;
        existingRecMap.set(key, r.id as string);
        existingRecNames.add(String(r.name).trim().toLowerCase());
      }

      const recToInsert: Array<Record<string, unknown>> = [];
      for (const rec of backup.recurring_transactions) {
        const key = `${rec.name.trim().toLowerCase()}|${rec.type}|${Number(rec.amount).toFixed(4)}|${rec.frequency}`;
        const existingId = existingRecMap.get(key);
        if (existingId && conflictStrategy !== "rename") {
          if (rec.id) recurringIdMap.set(rec.id, existingId);
          skipped.recurring_transactions++;
        } else {
          const newId = randomUUID();
          const finalName = existingId
            ? makeUniqueName(rec.name, existingRecNames)
            : rec.name;
          if (rec.id) recurringIdMap.set(rec.id, newId);
          existingRecMap.set(key, newId);
          recToInsert.push({
            id: newId,
            user_id: userId,
            name: finalName,
            type: rec.type,
            amount: Number(rec.amount),
            category_id: rec.category_id ? (categoryIdMap.get(rec.category_id) ?? null) : null,
            account_id: rec.account_id ? (accountIdMap.get(rec.account_id) ?? null) : null,
            description: rec.description ?? null,
            frequency: rec.frequency,
            custom_days: rec.custom_days ?? null,
            start_date: rec.start_date,
            end_date: rec.end_date ?? null,
            next_occurrence: rec.next_occurrence ?? null,
            last_generated_at: rec.last_generated_at ?? null,
            auto_create: Boolean(rec.auto_create),
            reminder_days: typeof rec.reminder_days === "number" ? rec.reminder_days : 0,
            status: rec.status ?? "active",
          });
        }
      }
      if (recToInsert.length > 0) {
        await insertInBatches(supabase, "recurring_transactions", recToInsert);
        restored.recurring_transactions += recToInsert.length;
      }

      // 4. Transactions
      const existingTxSigs = new Set(existingTxs.map((t) => txSignature(t)));
      const txsToInsert: Array<Record<string, unknown>> = [];
      for (const tx of backup.transactions) {
        const mappedAcc = tx.account_id ? (accountIdMap.get(tx.account_id) ?? null) : null;
        const mappedCat = tx.category_id ? (categoryIdMap.get(tx.category_id) ?? null) : null;
        const sig = txSignature({
          transaction_date: tx.transaction_date,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          account_id: mappedAcc,
          category_id: mappedCat,
        });

        if (existingTxSigs.has(sig)) {
          if (conflictStrategy === "rename") {
            const desc = tx.description ? `${tx.description} (Imported)` : "Imported transaction";
            txsToInsert.push({
              id: randomUUID(),
              user_id: userId,
              account_id: mappedAcc,
              category_id: mappedCat,
              type: tx.type,
              amount: Number(tx.amount),
              description: desc,
              notes: tx.notes ?? null,
              transaction_date: tx.transaction_date,
              recurring_transaction_id: tx.recurring_transaction_id
                ? (recurringIdMap.get(tx.recurring_transaction_id) ?? null)
                : null,
              is_auto_generated: Boolean(tx.is_auto_generated),
            });
          } else {
            skipped.transactions++;
          }
        } else {
          existingTxSigs.add(sig);
          txsToInsert.push({
            id: randomUUID(),
            user_id: userId,
            account_id: mappedAcc,
            category_id: mappedCat,
            type: tx.type,
            amount: Number(tx.amount),
            description: tx.description ?? null,
            notes: tx.notes ?? null,
            transaction_date: tx.transaction_date,
            recurring_transaction_id: tx.recurring_transaction_id
              ? (recurringIdMap.get(tx.recurring_transaction_id) ?? null)
              : null,
            is_auto_generated: Boolean(tx.is_auto_generated),
          });
        }
      }
      if (txsToInsert.length > 0) {
        await insertInBatches(supabase, "transactions", txsToInsert);
        restored.transactions = txsToInsert.length;
      }

      // 5. Budgets
      const existingBudgetMap = new Map<string, string>();
      for (const b of existingBudgetsRes.data ?? []) {
        existingBudgetMap.set(`${b.category_id}|${b.month}|${b.year}`, b.id as string);
      }
      const budgetsToInsert: Array<Record<string, unknown>> = [];
      for (const b of backup.budgets) {
        const mappedCat = categoryIdMap.get(b.category_id);
        if (!mappedCat) continue;
        const key = `${mappedCat}|${b.month}|${b.year}`;
        const existingId = existingBudgetMap.get(key);
        if (existingId) {
          if (conflictStrategy === "merge") {
            await supabase
              .from("budgets")
              .update({ limit_amount: Number(b.limit_amount) || 0 })
              .eq("id", existingId)
              .eq("user_id", userId);
            restored.budgets++;
          } else {
            skipped.budgets++;
          }
        } else {
          existingBudgetMap.set(key, "pending");
          budgetsToInsert.push({
            id: randomUUID(),
            user_id: userId,
            category_id: mappedCat,
            month: Number(b.month),
            year: Number(b.year),
            limit_amount: Number(b.limit_amount) || 0,
          });
        }
      }
      if (budgetsToInsert.length > 0) {
        await insertInBatches(supabase, "budgets", budgetsToInsert);
        restored.budgets += budgetsToInsert.length;
      }

      // 6. Savings Goals & Contributions
      const existingSavingsMap = new Map<string, string>();
      const existingSavingsNames = new Set<string>();
      for (const g of existingSavingsRes.data ?? []) {
        const lower = String(g.name).trim().toLowerCase();
        existingSavingsMap.set(lower, g.id as string);
        existingSavingsNames.add(lower);
      }
      const savingsToInsert: Array<Record<string, unknown>> = [];
      for (const g of backup.savings_goals) {
        const lower = g.name.trim().toLowerCase();
        const existingId = existingSavingsMap.get(lower);
        if (existingId) {
          if (conflictStrategy === "skip") {
            if (g.id) savingsGoalIdMap.set(g.id, existingId);
            skipped.savings_goals++;
          } else if (conflictStrategy === "merge") {
            await supabase
              .from("savings_goals")
              .update({
                target_amount: Number(g.target_amount) || 0,
                current_amount: Number(g.current_amount) || 0,
                monthly_contribution: Number(g.monthly_contribution ?? 0) || 0,
                target_date: g.target_date ?? null,
                status: g.status ?? "active",
              })
              .eq("id", existingId)
              .eq("user_id", userId);
            if (g.id) savingsGoalIdMap.set(g.id, existingId);
            restored.savings_goals++;
          } else {
            const newId = randomUUID();
            const newName = makeUniqueName(g.name, existingSavingsNames);
            if (g.id) savingsGoalIdMap.set(g.id, newId);
            savingsToInsert.push({
              id: newId,
              user_id: userId,
              name: newName,
              target_amount: Number(g.target_amount) || 0,
              current_amount: Number(g.current_amount) || 0,
              monthly_contribution: Number(g.monthly_contribution ?? 0) || 0,
              target_date: g.target_date ?? null,
              status: g.status ?? "active",
            });
          }
        } else {
          const newId = randomUUID();
          if (g.id) savingsGoalIdMap.set(g.id, newId);
          existingSavingsMap.set(lower, newId);
          existingSavingsNames.add(lower);
          savingsToInsert.push({
            id: newId,
            user_id: userId,
            name: g.name,
            target_amount: Number(g.target_amount) || 0,
            current_amount: Number(g.current_amount) || 0,
            monthly_contribution: Number(g.monthly_contribution ?? 0) || 0,
            target_date: g.target_date ?? null,
            status: g.status ?? "active",
          });
        }
      }
      if (savingsToInsert.length > 0) {
        await insertInBatches(supabase, "savings_goals", savingsToInsert);
        restored.savings_goals += savingsToInsert.length;
      }

      if ((backup.savings_contributions ?? []).length > 0) {
        const mappedGoalIds = Array.from(new Set(savingsGoalIdMap.values()));
        const existingContribs = new Set<string>();
        if (mappedGoalIds.length > 0) {
          const { data: contribData } = await supabase
            .from("savings_contributions")
            .select("goal_id,amount,contribution_date,notes")
            .in("goal_id", mappedGoalIds);
          for (const c of contribData ?? []) {
            existingContribs.add(
              `${c.goal_id}|${c.contribution_date}|${Number(c.amount).toFixed(4)}|${(c.notes ?? "").trim().toLowerCase()}`,
            );
          }
        }

        const contribsToInsert: Array<Record<string, unknown>> = [];
        for (const c of backup.savings_contributions ?? []) {
          const mappedGoalId = savingsGoalIdMap.get(c.goal_id);
          if (!mappedGoalId) continue;
          const sig = `${mappedGoalId}|${c.contribution_date}|${Number(c.amount).toFixed(4)}|${(c.notes ?? "").trim().toLowerCase()}`;
          if (existingContribs.has(sig) && conflictStrategy !== "rename") {
            skipped.savings_contributions++;
          } else {
            existingContribs.add(sig);
            contribsToInsert.push({
              id: randomUUID(),
              goal_id: mappedGoalId,
              amount: Number(c.amount) || 0,
              notes: c.notes ?? null,
              contribution_date: c.contribution_date,
            });
          }
        }
        if (contribsToInsert.length > 0) {
          await insertInBatches(supabase, "savings_contributions", contribsToInsert);
          restored.savings_contributions = contribsToInsert.length;
        }
      }

      // 7. Financial Goals
      const existingFinMap = new Map<string, string>();
      const existingFinNames = new Set<string>();
      for (const g of existingFinGoalsRes.data ?? []) {
        const lower = String(g.name).trim().toLowerCase();
        existingFinMap.set(lower, g.id as string);
        existingFinNames.add(lower);
      }
      const finToInsert: Array<Record<string, unknown>> = [];
      for (const g of backup.financial_goals) {
        const lower = g.name.trim().toLowerCase();
        const existingId = existingFinMap.get(lower);
        if (existingId) {
          if (conflictStrategy === "skip") {
            skipped.financial_goals++;
          } else if (conflictStrategy === "merge") {
            await supabase
              .from("financial_goals")
              .update({
                description: g.description ?? null,
                target_amount: g.target_amount != null ? Number(g.target_amount) : null,
                current_amount: Number(g.current_amount ?? 0) || 0,
                deadline: g.deadline ?? null,
                priority: g.priority ?? "medium",
                status: g.status ?? "active",
              })
              .eq("id", existingId)
              .eq("user_id", userId);
            restored.financial_goals++;
          } else {
            const newName = makeUniqueName(g.name, existingFinNames);
            finToInsert.push({
              id: randomUUID(),
              user_id: userId,
              name: newName,
              description: g.description ?? null,
              target_amount: g.target_amount != null ? Number(g.target_amount) : null,
              current_amount: Number(g.current_amount ?? 0) || 0,
              deadline: g.deadline ?? null,
              priority: g.priority ?? "medium",
              status: g.status ?? "active",
            });
          }
        } else {
          existingFinMap.set(lower, "pending");
          existingFinNames.add(lower);
          finToInsert.push({
            id: randomUUID(),
            user_id: userId,
            name: g.name,
            description: g.description ?? null,
            target_amount: g.target_amount != null ? Number(g.target_amount) : null,
            current_amount: Number(g.current_amount ?? 0) || 0,
            deadline: g.deadline ?? null,
            priority: g.priority ?? "medium",
            status: g.status ?? "active",
          });
        }
      }
      if (finToInsert.length > 0) {
        await insertInBatches(supabase, "financial_goals", finToInsert);
        restored.financial_goals += finToInsert.length;
      }
    }

    const restoredSettings = await restoreSettings(request, auth, backup, mode);

    return Response.json({
      ok: true,
      mode,
      restored,
      skipped,
      settings: restoredSettings,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to restore backup." },
      { status: 500 },
    );
  }
}
