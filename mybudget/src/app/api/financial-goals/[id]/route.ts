import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const resolved = context?.params ? await context.params : null;
  const id = resolved?.id;
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("financial_goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return jsonError(error, 404);
  if (!data) return Response.json({ error: "Goal not found" }, { status: 404 });
  return Response.json(data);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const resolved = context?.params ? await context.params : null;
  const id = resolved?.id;
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request payload" }, { status: 400 });

  const payload = { ...body };
  delete payload.id;
  delete payload.user_id;
  delete payload.created_at;

  const { data, error } = await auth.supabase
    .from("financial_goals")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select();

  if (error) return jsonError(error, 500);
  if (!data || data.length === 0) {
    return Response.json({ error: "Goal not found or permission denied" }, { status: 404 });
  }

  return Response.json(data[0]);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const resolved = context?.params ? await context.params : null;
  const id = resolved?.id;
  if (!id) return Response.json({ error: "Missing ID" }, { status: 400 });

  const { error } = await auth.supabase
    .from("financial_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return jsonError(error, 500);
  return new Response(null, { status: 204 });
}
