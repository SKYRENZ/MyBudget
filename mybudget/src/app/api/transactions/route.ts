import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("transactions")
    .select("*, accounts(name,type), categories(name,color,icon)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const { data, error } = await auth.supabase.from("transactions").insert({ ...body, user_id: auth.user.id }).select("*").single();
  if (error) return jsonError(error, 500);
  return Response.json(data, { status: 201 });
}
