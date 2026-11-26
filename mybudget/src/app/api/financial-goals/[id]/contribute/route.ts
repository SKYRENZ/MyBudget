import { deductContributionFromAccount } from "@/lib/contribution-account";
import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const resolved = context?.params ? await context.params : null;
  const id = resolved?.id;
  if (!id) return Response.json({ error: "Missing goal ID" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request payload" }, { status: 400 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Contribution amount must be greater than zero." }, { status: 400 });
  }

  const accountId = typeof body.account_id === "string" && body.account_id.trim() ? body.account_id.trim() : "";
  if (!accountId) {
    return Response.json({ error: "Select the account where the money came from." }, { status: 400 });
  }

  const { data: goal, error: goalError } = await auth.supabase
    .from("financial_goals")
    .select("id,name,current_amount")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (goalError || !goal) {
    return jsonError(goalError ?? new Error("Goal not found"), 404);
  }

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
    description: `Goal contribution – ${goal.name}`,
    notes,
    transactionDate: contributionDate,
  });

  if (!deduction.ok) {
    return Response.json({ error: deduction.error }, { status: deduction.status });
  }

  const nextAmount = Number(goal.current_amount ?? 0) + amount;
  const { data: updatedGoal, error: updateError } = await auth.supabase
    .from("financial_goals")
    .update({ current_amount: nextAmount })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (updateError) {
    await deduction.rollback();
    return jsonError(updateError, 500);
  }

  return Response.json(updatedGoal);
}
