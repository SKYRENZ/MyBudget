import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import {
  createAdminServerSupabase,
  createAnonServerSupabase,
  getRequestUser,
} from "@/lib/supabase-server";

export type CategorySortPreference =
  | "manual"
  | "spent_desc"
  | "spent_asc"
  | "remaining_desc"
  | "remaining_asc"
  | "name_asc"
  | "name_desc";

export type UserPreferencesPayload = {
  expenseLayout?: "transactions_first" | "categories_first";
  transactionDisplay?: "pagination" | "infinite";
  categoryIndicatorStyle?: "bar_dot" | "bar" | "dot" | "minimal";
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  budgetBehavior?: "carry_forward" | "manual";
  pageSize?: 25 | 50 | 100;
  defaultSort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  defaultCategorySort?: CategorySortPreference;
  defaultAmountVisibility?: "show" | "hide";
  autoHideOnStartup?: boolean;
};

const VALID_CATEGORY_SORTS: CategorySortPreference[] = [
  "manual",
  "spent_desc",
  "spent_asc",
  "remaining_desc",
  "remaining_asc",
  "name_asc",
  "name_desc",
];

function sanitizePreferences(raw: unknown): UserPreferencesPayload {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const clean: UserPreferencesPayload = {};

  if (obj.expenseLayout === "transactions_first" || obj.expenseLayout === "categories_first") {
    clean.expenseLayout = obj.expenseLayout;
  }
  if (obj.transactionDisplay === "pagination" || obj.transactionDisplay === "infinite") {
    clean.transactionDisplay = obj.transactionDisplay;
  }
  if (
    obj.categoryIndicatorStyle === "bar_dot" ||
    obj.categoryIndicatorStyle === "bar" ||
    obj.categoryIndicatorStyle === "dot" ||
    obj.categoryIndicatorStyle === "minimal"
  ) {
    clean.categoryIndicatorStyle = obj.categoryIndicatorStyle;
  }
  if (
    obj.dateFormat === "MM/DD/YYYY" ||
    obj.dateFormat === "DD/MM/YYYY" ||
    obj.dateFormat === "YYYY-MM-DD"
  ) {
    clean.dateFormat = obj.dateFormat;
  }
  if (obj.budgetBehavior === "carry_forward" || obj.budgetBehavior === "manual") {
    clean.budgetBehavior = obj.budgetBehavior;
  }
  if (obj.pageSize === 25 || obj.pageSize === 50 || obj.pageSize === 100) {
    clean.pageSize = obj.pageSize;
  }
  if (
    obj.defaultSort === "date_desc" ||
    obj.defaultSort === "date_asc" ||
    obj.defaultSort === "amount_desc" ||
    obj.defaultSort === "amount_asc"
  ) {
    clean.defaultSort = obj.defaultSort;
  }
  if (
    typeof obj.defaultCategorySort === "string" &&
    VALID_CATEGORY_SORTS.includes(obj.defaultCategorySort as CategorySortPreference)
  ) {
    clean.defaultCategorySort = obj.defaultCategorySort as CategorySortPreference;
  }
  if (obj.defaultAmountVisibility === "show" || obj.defaultAmountVisibility === "hide") {
    clean.defaultAmountVisibility = obj.defaultAmountVisibility;
  }
  if (typeof obj.autoHideOnStartup === "boolean") {
    clean.autoHideOnStartup = obj.autoHideOnStartup;
  }

  return clean;
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const prefs = sanitizePreferences(auth.user.user_metadata?.preferences);
  return NextResponse.json({ preferences: prefs });
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as UserPreferencesPayload | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
  }

  const existing = sanitizePreferences(auth.user.user_metadata?.preferences);
  const incoming = sanitizePreferences(body);
  const merged: UserPreferencesPayload = { ...existing, ...incoming };

  if (process.env.SUPABASE_SECRET_KEY) {
    const admin = createAdminServerSupabase();
    const { error } = await admin.auth.admin.updateUserById(auth.user.id, {
      user_metadata: {
        ...(auth.user.user_metadata ?? {}),
        preferences: merged,
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ preferences: merged });
  }

  const cookieSession = getSessionFromRequest(request);
  if (cookieSession) {
    const client = createAnonServerSupabase();
    await client.auth.setSession({
      access_token: cookieSession.access_token,
      refresh_token: cookieSession.refresh_token,
    });
    const { error } = await client.auth.updateUser({
      data: { preferences: merged },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ preferences: merged });
}
