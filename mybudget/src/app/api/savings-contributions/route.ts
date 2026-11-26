import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("savings_contributions")
    .select("*, savings_goals(name,user_id)")
    .order("contribution_date", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { data: goal, error: goalError } = await auth.supabase
    .from("savings_goals")
    .select("id,current_amount")
    .eq("id", body.goal_id)
    .single();
  if (goalError) return jsonError(goalError, 404);

  const { data, error } = await auth.supabase
    .from("savings_contributions")
    .insert({ goal_id: body.goal_id, amount: body.amount, notes: body.notes, contribution_date: body.contribution_date })
    .select()
    .single();
  if (error) return jsonError(error, 500);

  const { error: updateError } = await auth.supabase
    .from("savings_goals")
    .update({ current_amount: Number(goal.current_amount) + Number(body.amount) })
    .eq("id", body.goal_id);
  if (updateError) return jsonError(updateError, 500);

  return Response.json(data, { status: 201 });
}
