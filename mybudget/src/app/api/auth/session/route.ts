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
    return NextResponse.json({ authenticated: false, user: null });
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
