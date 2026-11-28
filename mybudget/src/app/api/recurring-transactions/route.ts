import { getRequestUser, jsonError } from "@/lib/supabase-server";
import type { RecurringFrequency } from "@/lib/database-types";

const ALLOWED_FREQUENCIES = new Set<RecurringFrequency>([
  "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "custom",
]);

function computeNextOccurrence(frequency: RecurringFrequency, customDays: number | null, fromDate: string): string {
  const date = new Date(fromDate);
  switch (frequency) {
    case "daily":      date.setDate(date.getDate() + 1); break;
    case "weekly":     date.setDate(date.getDate() + 7); break;
    case "biweekly":   date.setDate(date.getDate() + 14); break;
    case "monthly":    date.setMonth(date.getMonth() + 1); break;
    case "quarterly":  date.setMonth(date.getMonth() + 3); break;
    case "yearly":     date.setFullYear(date.getFullYear() + 1); break;
    case "custom":     date.setDate(date.getDate() + (customDays ?? 30)); break;
  }
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";

  let query = auth.supabase
    .from("recurring_transactions")
    .select("*, categories(name,color,icon), accounts(name,type)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (["active", "paused", "completed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return jsonError(error, 500);
  return Response.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (!ALLOWED_FREQUENCIES.has(body.frequency)) {
    return Response.json({ error: "Invalid frequency." }, { status: 400 });
  }
  if (!["income", "expense"].includes(body.type)) {
    return Response.json({ error: "Type must be income or expense." }, { status: 400 });
  }
  if (!body.start_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.start_date)) {
    return Response.json({ error: "Valid start_date is required." }, { status: 400 });
  }

  const nextOccurrence = computeNextOccurrence(
    body.frequency as RecurringFrequency,
    body.custom_days ?? null,
    body.start_date,
  );

  const payload = {
    user_id: auth.user.id,
    name: body.name.trim(),
    type: body.type,
    amount,
    category_id: body.category_id || null,
    account_id: body.account_id || null,
    description: body.description?.trim() || null,
    frequency: body.frequency,
    custom_days: body.frequency === "custom" ? (body.custom_days ?? null) : null,
    start_date: body.start_date,
    end_date: body.end_date || null,
    next_occurrence: nextOccurrence,
    auto_create: body.auto_create ?? false,
    reminder_days: body.reminder_days ?? 0,
    status: "active" as const,
  };

  const { data, error } = await auth.supabase
    .from("recurring_transactions")
    .insert(payload)
    .select("*")
    .single();

  if (error) return jsonError(error, 500);
  return Response.json(data, { status: 201 });
}
