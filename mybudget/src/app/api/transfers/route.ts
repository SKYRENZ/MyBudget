import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("account_transfers")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("transfer_date", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const fromAccountId = typeof body.from_account_id === "string" ? body.from_account_id : "";
  const toAccountId = typeof body.to_account_id === "string" ? body.to_account_id : "";
  const amount = Number(body.amount);

  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
    return Response.json({ error: "Select two different accounts." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Transfer amount must be greater than zero." }, { status: 400 });
  }

  const { data: accounts, error: accountError } = await auth.supabase
    .from("accounts")
    .select("id,balance")
    .eq("user_id", auth.user.id)
    .in("id", [fromAccountId, toAccountId]);

  if (accountError) return jsonError(accountError, 500);
  if (!accounts || accounts.length !== 2) {
    return Response.json({ error: "Account not found." }, { status: 404 });
  }

  const fromAccount = accounts.find((account) => account.id === fromAccountId);
  const toAccount = accounts.find((account) => account.id === toAccountId);
  if (!fromAccount || !toAccount) {
    return Response.json({ error: "Account not found." }, { status: 404 });
  }

  const fromBalance = Number(fromAccount.balance);
  const toBalance = Number(toAccount.balance);

  if (!Number.isFinite(fromBalance) || !Number.isFinite(toBalance)) {
    return Response.json({ error: "Invalid account balance data." }, { status: 500 });
  }
  if (fromBalance < amount) {
    return Response.json({ error: "Insufficient balance in source account." }, { status: 400 });
  }

  const nextFromBalance = fromBalance - amount;
  const nextToBalance = toBalance + amount;

  const { error: fromUpdateError } = await auth.supabase
    .from("accounts")
    .update({ balance: nextFromBalance })
    .eq("id", fromAccountId)
    .eq("user_id", auth.user.id);
  if (fromUpdateError) return jsonError(fromUpdateError, 500);

  const { error: toUpdateError } = await auth.supabase
    .from("accounts")
    .update({ balance: nextToBalance })
    .eq("id", toAccountId)
    .eq("user_id", auth.user.id);

  if (toUpdateError) {
    await auth.supabase
      .from("accounts")
      .update({ balance: fromBalance })
      .eq("id", fromAccountId)
      .eq("user_id", auth.user.id);
    return jsonError(toUpdateError, 500);
  }

  const { data, error } = await auth.supabase
    .from("account_transfers")
    .insert({
      ...body,
      amount,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      user_id: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    await auth.supabase
      .from("accounts")
      .update({ balance: fromBalance })
      .eq("id", fromAccountId)
      .eq("user_id", auth.user.id);
    await auth.supabase
      .from("accounts")
      .update({ balance: toBalance })
      .eq("id", toAccountId)
      .eq("user_id", auth.user.id);
    return jsonError(error, 500);
  }

  return Response.json(data, { status: 201 });
}
