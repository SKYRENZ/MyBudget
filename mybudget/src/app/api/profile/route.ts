import { getSessionFromRequest } from "@/lib/auth-session";
import {
  createAdminServerSupabase,
  createAnonServerSupabase,
  getRequestUser,
  jsonError,
} from "@/lib/supabase-server";

const PRIVACY_CONFIG_KEYS = [
  "hide_dashboard",
  "hide_category_budgets",
  "hide_transactions",
  "hide_accounts",
  "hide_goals_savings",
  "hide_reports",
] as const;

type PrivacyConfigKey = (typeof PRIVACY_CONFIG_KEYS)[number];

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  if (error) return jsonError(error, 404);

  const metaHide =
    typeof auth.user.user_metadata?.hide_amounts === "boolean"
      ? auth.user.user_metadata.hide_amounts
      : false;
  const metaConfig = (auth.user.user_metadata?.privacy_config ?? {}) as Record<string, unknown>;

  const sectionFlags: Record<PrivacyConfigKey, boolean> = {
    hide_dashboard: true,
    hide_category_budgets: true,
    hide_transactions: true,
    hide_accounts: true,
    hide_goals_savings: true,
    hide_reports: true,
  };

  for (const key of PRIVACY_CONFIG_KEYS) {
    if (typeof data[key] === "boolean") {
      sectionFlags[key] = data[key];
    } else if (typeof metaConfig[key] === "boolean") {
      sectionFlags[key] = metaConfig[key] as boolean;
    }
  }

  return Response.json({
    ...data,
    hide_amounts: typeof data.hide_amounts === "boolean" ? data.hide_amounts : metaHide,
    ...sectionFlags,
  });
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) return Response.json({ error: auth.error }, { status: auth.status });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request payload" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    updates.full_name = body.full_name;
  }
  if (body.is_new_user === 0 || body.is_new_user === 1) {
    updates.is_new_user = body.is_new_user;
  }
  if (typeof body.hide_amounts === "boolean") {
    updates.hide_amounts = body.hide_amounts;
  }
  for (const key of PRIVACY_CONFIG_KEYS) {
    if (typeof body[key] === "boolean") {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid profile fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.user.id)
    .select()
    .single();

  // Graceful fallback if privacy columns haven't been migrated onto profiles yet:
  // persist in Supabase Auth user_metadata so settings survive reloads & devices.
  if (error && error.message?.includes("column")) {
    const nonPrivacyUpdates: Record<string, unknown> = {};
    if (typeof updates.full_name === "string") nonPrivacyUpdates.full_name = updates.full_name;
    if (updates.is_new_user !== undefined) nonPrivacyUpdates.is_new_user = updates.is_new_user;
    if (Object.keys(nonPrivacyUpdates).length > 0) {
      await auth.supabase.from("profiles").update(nonPrivacyUpdates).eq("id", auth.user.id);
    }

    const existingMetaConfig = (auth.user.user_metadata?.privacy_config ?? {}) as Record<
      string,
      unknown
    >;
    const nextMetaConfig = { ...existingMetaConfig };
    for (const key of PRIVACY_CONFIG_KEYS) {
      if (typeof updates[key] === "boolean") {
        nextMetaConfig[key] = updates[key];
      }
    }

    const nextUserMetadata: Record<string, unknown> = {
      ...(auth.user.user_metadata ?? {}),
      privacy_config: nextMetaConfig,
    };
    if (typeof updates.hide_amounts === "boolean") {
      nextUserMetadata.hide_amounts = updates.hide_amounts;
    }

    if (process.env.SUPABASE_SECRET_KEY) {
      const admin = createAdminServerSupabase();
      await admin.auth.admin.updateUserById(auth.user.id, {
        user_metadata: nextUserMetadata,
      });
    } else {
      const cookieSession = getSessionFromRequest(request);
      if (cookieSession) {
        const client = createAnonServerSupabase();
        await client.auth.setSession({
          access_token: cookieSession.access_token,
          refresh_token: cookieSession.refresh_token,
        });
        await client.auth.updateUser({
          data: nextUserMetadata,
        });
      }
    }

    return Response.json({ id: auth.user.id, ...updates });
  }

  if (error) return jsonError(error, 500);
  return Response.json(data);
}
