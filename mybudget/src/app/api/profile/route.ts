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
  const body = await request.json();
  const { data, error } = await auth.supabase.from("profiles").update({ full_name: body.full_name }).eq("id", auth.user.id).select().single();
  if (error) return jsonError(error, 500);
  return Response.json(data);
}
