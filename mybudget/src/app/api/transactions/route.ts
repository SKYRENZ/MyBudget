import { getRequestUser, jsonError } from "@/lib/supabase-server";

function transactionBalanceDelta(type: unknown, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return 0;
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("transactions")
    .select("*, accounts(name,type), categories(name,color,icon)")
    .eq("user_id", auth.user.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  const accountId = typeof body.account_id === "string" && body.account_id.length > 0 ? body.account_id : null;
  const delta = transactionBalanceDelta(body.type, amount);

  let originalBalance: number | null = null;

  if (accountId && delta !== 0) {
    const { data: account, error: accountError } = await auth.supabase
      .from("accounts")
      .select("id,balance")
      .eq("id", accountId)
      .eq("user_id", auth.user.id)
      .single();

    if (accountError || !account) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    originalBalance = Number(account.balance);
    if (!Number.isFinite(originalBalance)) {
      return Response.json({ error: "Invalid account balance data." }, { status: 500 });
    }

    const nextBalance = originalBalance + delta;
    if (nextBalance < 0) {
      return Response.json({ error: "Insufficient balance in selected account." }, { status: 400 });
    }

    const { error: updateError } = await auth.supabase
      .from("accounts")
      .update({ balance: nextBalance })
      .eq("id", accountId)
      .eq("user_id", auth.user.id);

    if (updateError) return jsonError(updateError, 500);
  }

  const { data, error } = await auth.supabase
    .from("transactions")
    .insert({ ...body, amount, account_id: accountId, user_id: auth.user.id })
    .select("*")
    .single();

  if (error) {
    if (accountId && delta !== 0 && originalBalance !== null) {
      await auth.supabase
        .from("accounts")
        .update({ balance: originalBalance })
        .eq("id", accountId)
        .eq("user_id", auth.user.id);
    }
    return jsonError(error, 500);
  }

  return Response.json(data, { status: 201 });
}
