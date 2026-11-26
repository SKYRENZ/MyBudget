import { deductContributionFromAccount } from "@/lib/contribution-account";
import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("savings_contributions")
    .select("*, savings_goals!inner(name,user_id)")
    .eq("savings_goals.user_id", auth.user.id)
    .order("contribution_date", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Contribution amount must be greater than zero." }, { status: 400 });
  }

  const accountId = typeof body.account_id === "string" && body.account_id.trim() ? body.account_id.trim() : "";
  if (!accountId) {
    return Response.json({ error: "Select the account where the money came from." }, { status: 400 });
  }

  const { data: goal, error: goalError } = await auth.supabase
    .from("savings_goals")
    .select("id,name,current_amount")
    .eq("id", body.goal_id)
    .eq("user_id", auth.user.id)
    .single();
  if (goalError || !goal) return jsonError(goalError ?? new Error("Savings goal not found"), 404);

  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  const contributionDate =
    typeof body.contribution_date === "string" && body.contribution_date.trim()
      ? body.contribution_date.trim()
      : new Date().toISOString().slice(0, 10);

  const deduction = await deductContributionFromAccount({
    supabase: auth.supabase,
    userId: auth.user.id,
    accountId,
    amount,
    description: `Savings contribution – ${goal.name}`,
    notes,
    transactionDate: contributionDate,
  });

  if (!deduction.ok) {
    return Response.json({ error: deduction.error }, { status: deduction.status });
  }

  const storedNotes = notes ? `${notes} (From ${deduction.accountName})` : `From ${deduction.accountName}`;

  const { data, error } = await auth.supabase
    .from("savings_contributions")
    .insert({ goal_id: body.goal_id, amount, notes: storedNotes, contribution_date: contributionDate })
    .select()
    .single();
  if (error) {
    await deduction.rollback();
    return jsonError(error, 500);
  }

  const { error: updateError } = await auth.supabase
    .from("savings_goals")
    .update({ current_amount: Number(goal.current_amount) + amount })
    .eq("id", body.goal_id)
    .eq("user_id", auth.user.id);
  if (updateError) {
    await auth.supabase.from("savings_contributions").delete().eq("id", data.id);
    await deduction.rollback();
    return jsonError(updateError, 500);
  }

  return Response.json(data, { status: 201 });
}
