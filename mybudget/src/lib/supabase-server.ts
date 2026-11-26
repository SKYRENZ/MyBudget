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

export function createServerSupabase(accessToken: string): SupabaseClient {
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

  const supabase = createServerSupabase(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (!error && data.user) {
    return { supabase, user: data.user, status: 200 as const };
  }

  if (cookieSession?.refresh_token) {
    const anonClient = createAnonServerSupabase();
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
  const message = error instanceof Error ? error.message : "Request failed";
  return Response.json({ error: message }, { status });
}
