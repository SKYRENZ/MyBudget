import { NextResponse } from "next/server";
import {
  encryptSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-session";
import { getRequestUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    const response = NextResponse.json({ authenticated: false, user: null });
    // Clear any stale or invalid session cookie so middleware won't redirect back to /dashboard
    if (request.headers.get("cookie")?.includes(SESSION_COOKIE_NAME)) {
      response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
    }
    return response;
  }

  const metadata = auth.user.user_metadata as
    | { username?: string; full_name?: string }
    | undefined;
  const emailName = auth.user.email?.split("@")[0];
  const username = metadata?.username ?? metadata?.full_name ?? emailName ?? "Member";

  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      username,
    },
  });

  if (auth.refreshedSession) {
    response.cookies.set(
      SESSION_COOKIE_NAME,
      encryptSession(auth.refreshedSession),
      getSessionCookieOptions()
    );
  }

  return response;
}
