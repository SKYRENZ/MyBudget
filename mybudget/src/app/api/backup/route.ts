import type { SupabaseClient } from "@supabase/supabase-js";
import { BACKUP_SCHEMA_VERSION, type BackupSettings, type MyBudgetBackup } from "@/lib/backup";
import { getRequestUser } from "@/lib/supabase-server";

const BATCH_SIZE = 1000;

async function fetchAllPaginated<T>(
  queryBuilder: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await queryBuilder(offset, offset + BATCH_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return rows;
}

async function buildUserBackup(
  supabase: SupabaseClient,
  user: { id: string; user_metadata?: Record<string, unknown> },
  localSettings?: BackupSettings["local_settings"],
): Promise<MyBudgetBackup> {
  const userId = user.id;

  const [
    profileRes,
    accountsRes,
    categoriesRes,
    transactions,
    budgetsRes,
    savingsGoalsRes,
    savingsContributionsRes,
    financialGoalsRes,
    recurringRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "username,full_name,hide_amounts,hide_dashboard,hide_category_budgets,hide_transactions,hide_accounts,hide_goals_savings,hide_reports",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("accounts")
      .select("id,name,type,balance,color,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id,name,icon,color,monthly_budget,sort_order,is_pinned,created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    fetchAllPaginated((from, to) =>
      supabase
        .from("transactions")
        .select(
          "id,account_id,category_id,type,amount,description,notes,transaction_date,created_at,recurring_transaction_id,is_auto_generated",
        )
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    supabase
      .from("budgets")
      .select("id,category_id,month,year,limit_amount,created_at")
      .eq("user_id", userId)
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("savings_goals")
      .select("id,name,target_amount,current_amount,monthly_contribution,target_date,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("savings_contributions")
      .select("id,goal_id,amount,notes,contribution_date,created_at,savings_goals!inner(user_id)")
      .eq("savings_goals.user_id", userId)
      .order("contribution_date", { ascending: true }),
    supabase
      .from("financial_goals")
      .select("id,name,description,target_amount,current_amount,deadline,priority,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("recurring_transactions")
      .select(
        "id,name,type,amount,category_id,account_id,description,frequency,custom_days,start_date,end_date,next_occurrence,last_generated_at,auto_create,reminder_days,status,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (accountsRes.error) throw new Error(accountsRes.error.message);
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (budgetsRes.error) throw new Error(budgetsRes.error.message);
  if (savingsGoalsRes.error) throw new Error(savingsGoalsRes.error.message);
  if (financialGoalsRes.error) throw new Error(financialGoalsRes.error.message);
  if (recurringRes.error) throw new Error(recurringRes.error.message);

  const profile = profileRes.data as Record<string, unknown> | null;
  const metaPrefs = (user.user_metadata?.preferences ?? {}) as Record<string, unknown>;
  const metaPrivacy = (user.user_metadata?.privacy_config ?? {}) as Record<string, unknown>;

  const privacy: BackupSettings["privacy"] = {
    hide_amounts:
      typeof profile?.hide_amounts === "boolean"
        ? profile.hide_amounts
        : typeof user.user_metadata?.hide_amounts === "boolean"
          ? (user.user_metadata.hide_amounts as boolean)
          : false,
    hide_dashboard:
      typeof profile?.hide_dashboard === "boolean"
        ? profile.hide_dashboard
        : typeof metaPrivacy.hide_dashboard === "boolean"
          ? (metaPrivacy.hide_dashboard as boolean)
          : true,
    hide_category_budgets:
      typeof profile?.hide_category_budgets === "boolean"
        ? profile.hide_category_budgets
        : typeof metaPrivacy.hide_category_budgets === "boolean"
          ? (metaPrivacy.hide_category_budgets as boolean)
          : true,
    hide_transactions:
      typeof profile?.hide_transactions === "boolean"
        ? profile.hide_transactions
        : typeof metaPrivacy.hide_transactions === "boolean"
          ? (metaPrivacy.hide_transactions as boolean)
          : true,
    hide_accounts:
      typeof profile?.hide_accounts === "boolean"
        ? profile.hide_accounts
        : typeof metaPrivacy.hide_accounts === "boolean"
          ? (metaPrivacy.hide_accounts as boolean)
          : true,
    hide_goals_savings:
      typeof profile?.hide_goals_savings === "boolean"
        ? profile.hide_goals_savings
        : typeof metaPrivacy.hide_goals_savings === "boolean"
          ? (metaPrivacy.hide_goals_savings as boolean)
          : true,
    hide_reports:
      typeof profile?.hide_reports === "boolean"
        ? profile.hide_reports
        : typeof metaPrivacy.hide_reports === "boolean"
          ? (metaPrivacy.hide_reports as boolean)
          : true,
  };

  // Strip join helper property from savings_contributions
  const savingsContributions = (savingsContributionsRes.data ?? []).map((row) => ({
    id: row.id as string,
    goal_id: row.goal_id as string,
    amount: row.amount as number | string,
    notes: (row.notes ?? null) as string | null,
    contribution_date: row.contribution_date as string,
    created_at: row.created_at as string | undefined,
  }));

  return {
    version: BACKUP_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    user: {
      username: (profile?.username as string | null) ?? (user.user_metadata?.username as string | null) ?? null,
      full_name: (profile?.full_name as string | null) ?? (user.user_metadata?.full_name as string | null) ?? null,
    },
    accounts: accountsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    transactions,
    budgets: budgetsRes.data ?? [],
    savings_goals: savingsGoalsRes.data ?? [],
    savings_contributions: savingsContributions,
    financial_goals: financialGoalsRes.data ?? [],
    recurring_transactions: recurringRes.data ?? [],
    settings: {
      preferences: metaPrefs,
      privacy,
      ...(localSettings ? { local_settings: localSettings } : {}),
    },
  };
}

function createStreamingBackupResponse(backup: MyBudgetBackup) {
  const datePart = new Date().toISOString().slice(0, 10);
  const filename = `mybudget-backup-${datePart}.json`;
  const encoder = new TextEncoder();

  // Stream JSON in chunks to avoid holding a duplicate giant string buffer on large backups
  const stream = new ReadableStream({
    start(controller) {
      try {
        const header = JSON.stringify(
          {
            version: backup.version,
            exported_at: backup.exported_at,
            user: backup.user,
            accounts: backup.accounts,
            categories: backup.categories,
          },
          null,
          2,
        );
        // Remove trailing "}" so we can stream transactions and remaining sections cleanly
        controller.enqueue(encoder.encode(`${header.slice(0, -1)},\n  "transactions": [`));

        const chunkSize = 200;
        for (let i = 0; i < backup.transactions.length; i += chunkSize) {
          const slice = backup.transactions.slice(i, i + chunkSize);
          const serialized = slice.map((tx) => `    ${JSON.stringify(tx)}`).join(",\n");
          const prefix = i === 0 ? "\n" : ",\n";
          controller.enqueue(encoder.encode(`${prefix}${serialized}`));
        }

        const tail = JSON.stringify(
          {
            budgets: backup.budgets,
            savings_goals: backup.savings_goals,
            savings_contributions: backup.savings_contributions ?? [],
            financial_goals: backup.financial_goals,
            recurring_transactions: backup.recurring_transactions,
            settings: backup.settings,
          },
          null,
          2,
        );

        controller.enqueue(
          encoder.encode(`${backup.transactions.length > 0 ? "\n  " : ""}],\n${tail.slice(1)}\n`),
        );
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const backup = await buildUserBackup(auth.supabase, auth.user);
    return createStreamingBackupResponse(backup);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create backup." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    local_settings?: BackupSettings["local_settings"];
  } | null;

  try {
    const backup = await buildUserBackup(auth.supabase, auth.user, body?.local_settings);
    return createStreamingBackupResponse(backup);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create backup." },
      { status: 500 },
    );
  }
}
