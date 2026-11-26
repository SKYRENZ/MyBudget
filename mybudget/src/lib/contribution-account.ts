import type { SupabaseClient } from "@supabase/supabase-js";

type DeductSuccess = {
  ok: true;
  accountName: string;
  rollback: () => Promise<void>;
};

type DeductFailure = {
  ok: false;
  error: string;
  status: number;
};

/**
 * Deducts a contribution amount from a user's account and logs a transfer transaction.
 */
export async function deductContributionFromAccount({
  supabase,
  userId,
  accountId,
  amount,
  description,
  notes,
  transactionDate,
}: {
  supabase: SupabaseClient;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  notes: string | null;
  transactionDate: string;
}): Promise<DeductSuccess | DeductFailure> {
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id,name,balance")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (accountError || !account) {
    return { ok: false, error: "Selected account not found.", status: 404 };
  }

  const originalBalance = Number(account.balance);
  if (!Number.isFinite(originalBalance)) {
    return { ok: false, error: "Invalid account balance data.", status: 500 };
  }

  const nextBalance = originalBalance - amount;
  if (nextBalance < 0) {
    return { ok: false, error: "Insufficient balance in selected account.", status: 400 };
  }

  const { error: balanceError } = await supabase
    .from("accounts")
    .update({ balance: nextBalance })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (balanceError) {
    return { ok: false, error: balanceError.message, status: 500 };
  }

  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: accountId,
      type: "transfer",
      amount,
      description,
      notes,
      transaction_date: transactionDate,
    })
    .select("id")
    .single();

  if (txError) {
    await supabase
      .from("accounts")
      .update({ balance: originalBalance })
      .eq("id", accountId)
      .eq("user_id", userId);
    return { ok: false, error: txError.message, status: 500 };
  }

  return {
    ok: true,
    accountName: account.name,
    rollback: async () => {
      await supabase
        .from("accounts")
        .update({ balance: originalBalance })
        .eq("id", accountId)
        .eq("user_id", userId);
      if (tx?.id) {
        await supabase
          .from("transactions")
          .delete()
          .eq("id", tx.id)
          .eq("user_id", userId);
      }
    },
  };
}
