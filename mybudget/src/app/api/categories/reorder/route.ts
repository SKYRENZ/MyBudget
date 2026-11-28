import { NextResponse } from "next/server";
import { getRequestUser, jsonError } from "@/lib/supabase-server";

type ReorderItem = {
  id: string;
  sort_order: number;
  is_pinned: boolean;
};

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
  }

  const items: ReorderItem[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id !== "string" || !obj.id) continue;
    items.push({
      id: obj.id,
      sort_order: typeof obj.sort_order === "number" && Number.isFinite(obj.sort_order) ? obj.sort_order : 0,
      is_pinned: Boolean(obj.is_pinned),
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  // Update each category's sort_order and is_pinned in Supabase
  const results = await Promise.all(
    items.map((item) =>
      auth.supabase
        .from("categories")
        .update({ sort_order: item.sort_order, is_pinned: item.is_pinned })
        .eq("id", item.id)
        .eq("user_id", auth.user.id),
    ),
  );

  const firstError = results.find((r) => r.error)?.error;
  if (firstError) {
    return jsonError(firstError, 500);
  }

  return NextResponse.json({ updated: items.length });
}
