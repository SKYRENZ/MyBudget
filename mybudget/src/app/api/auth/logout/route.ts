import { NextResponse } from "next/server";
import {
  getSessionCookieOptions,
  getSessionFromRequest,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-session";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (session?.access_token) {
    try {
      const supabase = createServerSupabase(session.access_token);
      await supabase.auth.signOut();
    } catch {
      // Ignore upstream sign-out errors and always clear local session cookie
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieOptions(0));
  return response;
}
