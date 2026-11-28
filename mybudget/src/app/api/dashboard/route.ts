import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  let transactionQuery = auth.supabase
    .from("transactions")
    .select("*, accounts(name), categories(name,color)")
    .eq("user_id", auth.user.id);

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = new Date(Number(year), Number(month), 1);
    const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    transactionQuery = transactionQuery.gte("transaction_date", start).lt("transaction_date", end);
  }

  const categoriesPromise = auth.supabase
    .from("categories")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const [transactions, accounts, initialCategories, savingsGoals, budgets] = await Promise.all([
    transactionQuery.order("transaction_date", { ascending: false }),
    auth.supabase.from("accounts").select("*").eq("user_id", auth.user.id).order("name"),
    categoriesPromise,
    auth.supabase.from("savings_goals").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
    month && year
      ? auth.supabase.from("budgets").select("*, categories(name,icon,color)").eq("user_id", auth.user.id).eq("month", Number(month)).eq("year", Number(year))
      : auth.supabase.from("budgets").select("*, categories(name,icon,color)").eq("user_id", auth.user.id),
  ]);

  let categories = initialCategories;

  // Graceful fallback if sort_order / is_pinned columns have not been migrated yet
  if (categories.error && categories.error.message?.includes("column")) {
    categories = await auth.supabase
      .from("categories")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("name", { ascending: true });
  }

  for (const result of [transactions, accounts, categories, savingsGoals, budgets]) {
    if (result.error) return jsonError(result.error, 500);
  }

  return Response.json({
    transactions: transactions.data ?? [],
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    savingsGoals: savingsGoals.data ?? [],
    budgets: budgets.data ?? [],
  });
}
