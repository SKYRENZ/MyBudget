import { getRequestUser, jsonError } from "@/lib/supabase-server";

const ALLOWED_PAGE_SIZES = new Set([10, 25, 50, 100]);
const ALLOWED_TYPES = new Set(["income", "expense", "transfer"]);

function transactionBalanceDelta(type: unknown, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (type === "income") return amount;
  if (type === "expense") return -amount;
  return 0;
}

function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()%*]/g, " ").trim();
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const paginated = url.searchParams.get("paginated") === "1";

  if (!paginated) {
    const { data, error } = await auth.supabase
      .from("transactions")
      .select("*, accounts(name,type), categories(name,color,icon)")
      .eq("user_id", auth.user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return jsonError(error, 500);
    return Response.json(data);
  }

  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const rawPageSize = Number(url.searchParams.get("pageSize") ?? "25");
  const pageSize = ALLOWED_PAGE_SIZES.has(rawPageSize) ? rawPageSize : 25;

  const search = sanitizeSearchTerm(url.searchParams.get("search") ?? "");
  const startDate = url.searchParams.get("startDate") ?? "";
  const endDate = url.searchParams.get("endDate") ?? "";
  const categoryId = url.searchParams.get("categoryId") ?? "";
  const accountId = url.searchParams.get("accountId") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const sort = url.searchParams.get("sort") ?? "date_desc";

  let query = auth.supabase
    .from("transactions")
    .select("*, accounts(name,type), categories(name,color,icon)", { count: "exact" })
    .eq("user_id", auth.user.id);

  if (search) {
    query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    query = query.gte("transaction_date", startDate);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    query = query.lte("transaction_date", endDate);
  }

  if (categoryId === "uncategorized") {
    query = query.is("category_id", null);
  } else if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  if (ALLOWED_TYPES.has(type)) {
    query = query.eq("type", type);
  }

  switch (sort) {
    case "date_asc":
      query = query
        .order("transaction_date", { ascending: true })
        .order("created_at", { ascending: true });
      break;
    case "amount_desc":
      query = query
        .order("amount", { ascending: false })
        .order("transaction_date", { ascending: false });
      break;
    case "amount_asc":
      query = query
        .order("amount", { ascending: true })
        .order("transaction_date", { ascending: false });
      break;
    case "date_desc":
    default:
      query = query
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) return jsonError(error, 500);

  const total = count ?? 0;
  return Response.json({
    items: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }

  const accountId = typeof body.account_id === "string" && body.account_id.length > 0 ? body.account_id : null;
  const delta = transactionBalanceDelta(body.type, amount);

  let originalBalance: number | null = null;

  if (accountId && delta !== 0) {
    const { data: account, error: accountError } = await auth.supabase
      .from("accounts")
      .select("id,balance")
      .eq("id", accountId)
      .eq("user_id", auth.user.id)
      .single();

    if (accountError || !account) {
      return Response.json({ error: "Account not found." }, { status: 404 });
    }

    originalBalance = Number(account.balance);
    if (!Number.isFinite(originalBalance)) {
      return Response.json({ error: "Invalid account balance data." }, { status: 500 });
    }

    const nextBalance = originalBalance + delta;
    if (nextBalance < 0) {
      return Response.json({ error: "Insufficient balance in selected account." }, { status: 400 });
    }

    const { error: updateError } = await auth.supabase
      .from("accounts")
      .update({ balance: nextBalance })
      .eq("id", accountId)
      .eq("user_id", auth.user.id);

    if (updateError) return jsonError(updateError, 500);
  }

  const { data, error } = await auth.supabase
    .from("transactions")
    .insert({ ...body, amount, account_id: accountId, user_id: auth.user.id })
    .select("*")
    .single();

  if (error) {
    if (accountId && delta !== 0 && originalBalance !== null) {
      await auth.supabase
        .from("accounts")
        .update({ balance: originalBalance })
        .eq("id", accountId)
        .eq("user_id", auth.user.id);
    }
    return jsonError(error, 500);
  }

  return Response.json(data, { status: 201 });
}
