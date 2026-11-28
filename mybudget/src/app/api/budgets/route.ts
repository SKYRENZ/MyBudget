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

  const categoryId = typeof body.category_id === "string" ? body.category_id : null;
  const month = Number(body.month);
  const year = Number(body.year);
  const limitAmount = Number(body.limit_amount);

  if (!categoryId || !Number.isFinite(month) || !Number.isFinite(year) || !Number.isFinite(limitAmount) || limitAmount < 0) {
    return Response.json({ error: "Invalid budget payload." }, { status: 400 });
  }

  // Upsert for (user_id, category_id, month, year) so historical months are never overwritten
  const { data: existing } = await auth.supabase
    .from("budgets")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("category_id", categoryId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await auth.supabase
      .from("budgets")
      .update({ limit_amount: limitAmount })
      .eq("id", existing.id)
      .eq("user_id", auth.user.id)
      .select()
      .single();
    if (error) return jsonError(error, 500);
    return Response.json(data, { status: 200 });
  }

  const { data, error } = await auth.supabase
    .from("budgets")
    .insert({
      category_id: categoryId,
      month,
      year,
      limit_amount: limitAmount,
      user_id: auth.user.id,
    })
    .select()
    .single();
  if (error) return jsonError(error, 500);
  return Response.json(data, { status: 201 });
}
