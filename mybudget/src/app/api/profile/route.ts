import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  if (error) return jsonError(error, 404);
  return Response.json(data);
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = (await request.json().catch(() => null)) as {
    full_name?: unknown;
    is_new_user?: unknown;
  } | null;
  if (!body) return Response.json({ error: "Invalid request payload" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    updates.full_name = body.full_name;
  }
  if (body.is_new_user === 0 || body.is_new_user === 1) {
    updates.is_new_user = body.is_new_user;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid profile fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.user.id)
    .select()
    .single();
  if (error) return jsonError(error, 500);
  return Response.json(data);
}
