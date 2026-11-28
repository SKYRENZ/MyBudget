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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const { data, error } = await auth.supabase
    .from("recurring_transactions")
    .select("*, categories(name,color,icon), accounts(name,type)")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();
  if (error) return jsonError(error, 404);
  return Response.json(data);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const body = await request.json();

  // Verify ownership
  const { data: existing, error: existingError } = await auth.supabase
    .from("recurring_transactions")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();
  if (existingError || !existing) {
    return Response.json({ error: "Recurring transaction not found." }, { status: 404 });
  }

  const payload: Record<string, unknown> = {};

  if (body.name !== undefined) payload.name = body.name?.trim();
  if (body.type !== undefined) {
    if (!["income", "expense"].includes(body.type)) {
      return Response.json({ error: "Type must be income or expense." }, { status: 400 });
    }
    payload.type = body.type;
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Amount must be greater than zero." }, { status: 400 });
    }
    payload.amount = amount;
  }
  if (body.category_id !== undefined) payload.category_id = body.category_id || null;
  if (body.account_id !== undefined) payload.account_id = body.account_id || null;
  if (body.description !== undefined) payload.description = body.description?.trim() || null;
  if (body.frequency !== undefined) {
    if (!ALLOWED_FREQUENCIES.has(body.frequency)) {
      return Response.json({ error: "Invalid frequency." }, { status: 400 });
    }
    payload.frequency = body.frequency;
    payload.custom_days = body.frequency === "custom" ? (body.custom_days ?? null) : null;
  }
  if (body.start_date !== undefined) payload.start_date = body.start_date;
  if (body.end_date !== undefined) payload.end_date = body.end_date || null;
  if (body.auto_create !== undefined) payload.auto_create = body.auto_create;
  if (body.reminder_days !== undefined) payload.reminder_days = body.reminder_days ?? 0;
  if (body.status !== undefined) {
    if (!["active", "paused", "completed"].includes(body.status)) {
      return Response.json({ error: "Invalid status." }, { status: 400 });
    }
    payload.status = body.status;
  }
  if (body.next_occurrence !== undefined) payload.next_occurrence = body.next_occurrence;

  // Recompute next_occurrence if frequency or start_date changed
  if ((payload.frequency || payload.start_date) && payload.next_occurrence === undefined) {
    const { data: current } = await auth.supabase
      .from("recurring_transactions")
      .select("frequency, custom_days, next_occurrence, start_date")
      .eq("id", id)
      .single();
    if (current) {
      const freq = (payload.frequency ?? current.frequency) as RecurringFrequency;
      const customDays = (payload.custom_days ?? current.custom_days) as number | null;
      const fromDate = (payload.start_date ?? current.next_occurrence ?? current.start_date) as string;
      payload.next_occurrence = computeNextOccurrence(freq, customDays, fromDate);
    }
  }

  const { data, error } = await auth.supabase
    .from("recurring_transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) return jsonError(error, 500);
  return Response.json(data);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;

  const { error } = await auth.supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) return jsonError(error, 500);
  return new Response(null, { status: 204 });
}
