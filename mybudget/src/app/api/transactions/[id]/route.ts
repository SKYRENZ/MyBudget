import { getRequestUser, jsonError } from "@/lib/supabase-server";

function transactionBalanceDelta(type: unknown, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return 0;
}

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinEditWindow(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return Date.now() - createdMs <= EDIT_WINDOW_MS;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request); if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params; const { data, error } = await auth.supabase.from("transactions").select("*").eq("id", id).single();
  if (error) return jsonError(error, 404); return Response.json(data);
}
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const body = await request.json();

  const { data: existingTx, error: existingTxError } = await auth.supabase
    .from("transactions")
    .select("id,account_id,type,amount,created_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (existingTxError || !existingTx) {
    return Response.json({ error: "Transaction not found." }, { status: 404 });
  }

  if (!isWithinEditWindow(existingTx.created_at)) {
    return Response.json(
      { error: "Transaction is locked. Transactions older than 7 days can no longer be modified." },
      { status: 403 },
    );
  }

  const previousAmount = Number(existingTx.amount);
  if (!Number.isFinite(previousAmount) || previousAmount <= 0) {
    return Response.json({ error: "Invalid transaction amount data." }, { status: 500 });
  }

  const nextAmount = body.amount === undefined ? previousAmount : Number(body.amount);
  if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
    return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  const nextType = body.type === undefined ? existingTx.type : body.type;
  const nextAccountId =
    body.account_id === undefined
      ? existingTx.account_id
      : (typeof body.account_id === "string" && body.account_id.length > 0 ? body.account_id : null);

  const previousDelta = transactionBalanceDelta(existingTx.type, previousAmount);
  const nextDelta = transactionBalanceDelta(nextType, nextAmount);

  const accountChanges = new Map<string, number>();

  if (existingTx.account_id && previousDelta !== 0) {
    accountChanges.set(existingTx.account_id, (accountChanges.get(existingTx.account_id) ?? 0) - previousDelta);
  }

  if (nextAccountId && nextDelta !== 0) {
    accountChanges.set(nextAccountId, (accountChanges.get(nextAccountId) ?? 0) + nextDelta);
  }

  const originalBalances = new Map<string, number>();
  const appliedBalances = new Map<string, number>();

  for (const [accountId, delta] of accountChanges) {
    if (delta === 0) continue;

    const { data: account, error: accountError } = await auth.supabase
      .from("accounts")
      .select("id,balance")
      .eq("id", accountId)
      .eq("user_id", auth.user.id)
      .single();

    if (accountError || !account) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    const originalBalance = Number(account.balance);
    if (!Number.isFinite(originalBalance)) {
      return Response.json({ error: "Invalid account balance data." }, { status: 500 });
    }

    const updatedBalance = originalBalance + delta;
    if (updatedBalance < 0) {
      return Response.json({ error: "Insufficient balance in selected account." }, { status: 400 });
    }

    originalBalances.set(accountId, originalBalance);
    appliedBalances.set(accountId, updatedBalance);
  }

  for (const [accountId, updatedBalance] of appliedBalances) {
    const { error: updateError } = await auth.supabase
      .from("accounts")
      .update({ balance: updatedBalance })
      .eq("id", accountId)
      .eq("user_id", auth.user.id);

    if (updateError) {
      return jsonError(updateError, 500);
    }
  }

  const payload: Record<string, unknown> = {
    ...body,
    amount: nextAmount,
    type: nextType,
    account_id: nextAccountId,
  };
  delete payload.id;
  delete payload.user_id;
  delete payload.created_at;

  const { data, error } = await auth.supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) {
    for (const [accountId, originalBalance] of originalBalances) {
      await auth.supabase
        .from("accounts")
        .update({ balance: originalBalance })
        .eq("id", accountId)
        .eq("user_id", auth.user.id);
    }
    return jsonError(error, 500);
  }

  return Response.json(data);
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;

  const { data: existingTx, error: existingTxError } = await auth.supabase
    .from("transactions")
    .select("id,account_id,type,amount,created_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (existingTxError || !existingTx) {
    return Response.json({ error: "Transaction not found." }, { status: 404 });
  }

  if (!isWithinEditWindow(existingTx.created_at)) {
    return Response.json(
      { error: "Transaction is locked. Transactions older than 7 days can no longer be modified." },
      { status: 403 },
    );
  }

  const amount = Number(existingTx.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Invalid transaction amount data." }, { status: 500 });
  }

  const delta = transactionBalanceDelta(existingTx.type, amount);

  let originalBalance: number | null = null;

  if (existingTx.account_id && delta !== 0) {
    const { data: account, error: accountError } = await auth.supabase
      .from("accounts")
      .select("id,balance")
      .eq("id", existingTx.account_id)
      .eq("user_id", auth.user.id)
      .single();

    if (accountError || !account) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    originalBalance = Number(account.balance);
    if (!Number.isFinite(originalBalance)) {
      return Response.json({ error: "Invalid account balance data." }, { status: 500 });
    }

    const updatedBalance = originalBalance - delta;
    if (updatedBalance < 0) {
      return Response.json({ error: "Insufficient balance in selected account." }, { status: 400 });
    }

    const { error: updateError } = await auth.supabase
      .from("accounts")
      .update({ balance: updatedBalance })
      .eq("id", existingTx.account_id)
      .eq("user_id", auth.user.id);

    if (updateError) return jsonError(updateError, 500);
  }

  const { error } = await auth.supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    if (existingTx.account_id && originalBalance !== null) {
      await auth.supabase
        .from("accounts")
        .update({ balance: originalBalance })
        .eq("id", existingTx.account_id)
        .eq("user_id", auth.user.id);
    }
    return jsonError(error, 500);
  }

  return new Response(null, { status: 204 });
}
