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

type RefreshedSessionCacheEntry = {
  user: User;
  refreshedSession: StoredSession;
  cachedAt: number;
};

const REFRESH_CACHE_TTL_MS = 15_000;
const inFlightRefreshes = new Map<string, Promise<RefreshedSessionCacheEntry | null>>();
const recentRefreshes = new Map<string, RefreshedSessionCacheEntry>();

function pruneRecentRefreshes(now: number) {
  for (const [token, entry] of recentRefreshes.entries()) {
    if (now - entry.cachedAt > REFRESH_CACHE_TTL_MS) {
      recentRefreshes.delete(token);
    }
  }
}

async function refreshSessionDeduped(
  anonClient: SupabaseClient,
  refreshToken: string,
): Promise<RefreshedSessionCacheEntry | null> {
  const now = Date.now();
  pruneRecentRefreshes(now);

  const cached = recentRefreshes.get(refreshToken);
  if (cached) {
    return cached;
  }

  let promise = inFlightRefreshes.get(refreshToken);
  if (!promise) {
    promise = (async () => {
      const { data: refreshed, error: refreshError } = await anonClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (!refreshError && refreshed.session && refreshed.user) {
        const entry: RefreshedSessionCacheEntry = {
          user: refreshed.user,
          refreshedSession: {
            access_token: refreshed.session.access_token,
            refresh_token: refreshed.session.refresh_token,
            expires_at: refreshed.session.expires_at,
          },
          cachedAt: Date.now(),
        };
        recentRefreshes.set(refreshToken, entry);
        return entry;
      }
      return null;
    })().finally(() => {
      inFlightRefreshes.delete(refreshToken);
    });

    inFlightRefreshes.set(refreshToken, promise);
  }

  return promise;
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
    const refreshed = await refreshSessionDeduped(anonClient, cookieSession.refresh_token);
    if (refreshed) {
      return {
        supabase: createServerSupabase(refreshed.refreshedSession.access_token),
        user: refreshed.user,
        refreshedSession: refreshed.refreshedSession,
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
