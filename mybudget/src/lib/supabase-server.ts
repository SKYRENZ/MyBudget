import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSessionFromRequest, type StoredSession } from "@/lib/auth-session";

function getSupabaseServerEnv() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server configuration");
  }

  return { url, key };
}

export function createAnonServerSupabase(): SupabaseClient {
  const { url, key } = getSupabaseServerEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAdminServerSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server configuration");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServerSupabase(accessToken: string): SupabaseClient {
  if (process.env.SUPABASE_SECRET_KEY) {
    return createAdminServerSupabase();
  }

  const { url, key } = getSupabaseServerEnv();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

type AuthenticatedRequest =
  | {
      supabase: SupabaseClient;
      user: User;
      refreshedSession?: StoredSession;
      status: 200;
    }
  | {
      error: string;
      status: 401;
    };

export async function getRequestUser(request: Request): Promise<AuthenticatedRequest> {
  const cookieSession = getSessionFromRequest(request);
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const accessToken = cookieSession?.access_token ?? bearerToken;
  if (!accessToken) {
    return { error: "Please sign in to access your budget", status: 401 as const };
  }

  const anonClient = createAnonServerSupabase();
  const { data, error } = await anonClient.auth.getUser(accessToken);

  if (!error && data.user) {
    return { supabase: createServerSupabase(accessToken), user: data.user, status: 200 as const };
  }

  if (cookieSession?.refresh_token) {
    const { data: refreshed, error: refreshError } = await anonClient.auth.refreshSession({
      refresh_token: cookieSession.refresh_token,
    });

    if (!refreshError && refreshed.session && refreshed.user) {
      return {
        supabase: createServerSupabase(refreshed.session.access_token),
        user: refreshed.user,
        refreshedSession: {
          access_token: refreshed.session.access_token,
          refresh_token: refreshed.session.refresh_token,
          expires_at: refreshed.session.expires_at,
        },
        status: 200 as const,
      };
    }
  }

  return { error: "Invalid or expired session", status: 401 as const };
}

export function jsonError(error: unknown, status = 400) {
  let message = "Request failed";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof (error as { message: unknown }).message === "string") {
      message = (error as { message: string }).message;
    } else {
      message = JSON.stringify(error);
    }
  } else if (typeof error === "string") {
    message = error;
  }
  return Response.json({ error: message }, { status });
}
