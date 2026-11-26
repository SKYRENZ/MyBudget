import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  let transactionQuery = auth.supabase
    .from("transactions")
    .select("*, accounts(name), categories(name,color)");

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = new Date(Number(year), Number(month), 1);
    const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    transactionQuery = transactionQuery.gte("transaction_date", start).lt("transaction_date", end);
  }

  const [transactions, accounts, categories, savingsGoals, budgets] = await Promise.all([
    transactionQuery.order("transaction_date", { ascending: false }),
    auth.supabase.from("accounts").select("*").order("name"),
    auth.supabase.from("categories").select("*").order("name"),
    auth.supabase.from("savings_goals").select("*").order("created_at", { ascending: false }),
    month && year
      ? auth.supabase.from("budgets").select("*, categories(name,icon,color)").eq("month", Number(month)).eq("year", Number(year))
      : auth.supabase.from("budgets").select("*, categories(name,icon,color)"),
  ]);

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
