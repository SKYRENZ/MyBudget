import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  let { data, error } = await auth.supabase
    .from("categories")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  // Graceful fallback if sort_order / is_pinned columns have not been migrated yet
  if (error && error.message?.includes("column")) {
    const fallback = await auth.supabase
      .from("categories")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("name", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const { data, error } = await auth.supabase.from("categories").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return jsonError(error, 500);
  return Response.json(data, { status: 201 });
}
