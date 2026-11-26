import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("accounts")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const { data, error } = await auth.supabase.from("accounts").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return jsonError(error, 500);

  // When an account is created with an initial balance > 0, automatically
  // record an "income" transaction so it shows up in dashboard & reports.
  const initialBalance = Number(data.balance);
  if (initialBalance > 0) {
    await auth.supabase.from("transactions").insert({
      user_id: auth.user.id,
      account_id: data.id,
      type: "income",
      amount: initialBalance,
      description: `Initial balance – ${data.name}`,
      transaction_date: new Date().toISOString().slice(0, 10),
    });
  }

  return Response.json(data, { status: 201 });
}
