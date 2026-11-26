import { getRequestUser, jsonError } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  let query = auth.supabase
    .from("budgets")
    .select("*, categories(name,icon,color)")
    .eq("user_id", auth.user.id);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");
  if (month) query = query.eq("month", Number(month));
  if (year) query = query.eq("year", Number(year));
  const { data, error } = await query.order("year", { ascending: false }).order("month", { ascending: false });
  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const { data, error } = await auth.supabase.from("budgets").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return jsonError(error, 500);
  return Response.json(data, { status: 201 });
}
