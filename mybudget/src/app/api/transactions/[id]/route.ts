import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request); if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params; const { data, error } = await auth.supabase.from("transactions").select("*").eq("id", id).single();
  if (error) return jsonError(error, 404); return Response.json(data);
}
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request); if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params; const body = await request.json(); const { data, error } = await auth.supabase.from("transactions").update(body).eq("id", id).select().single();
  if (error) return jsonError(error, 500); return Response.json(data);
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request); if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params; const { error } = await auth.supabase.from("transactions").delete().eq("id", id);
  if (error) return jsonError(error, 500); return new Response(null, { status: 204 });
}
