import { NextResponse } from "next/server";
import {
  encryptSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  usernameToEmail,
} from "@/lib/auth-session";
import { createAnonServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      username?: string;
      password?: string;
    } | null;

    const cleanUsername = body?.username?.trim() ?? "";
    const password = body?.password ?? "";

    if (!cleanUsername || !password) {
      return NextResponse.json(
        { error: "Enter both your username and password." },
        { status: 400 }
      );
    }

    const email = usernameToEmail(cleanUsername);
    const supabase = createAnonServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Authentication failed." },
        { status: 401 }
      );
    }

    const encrypted = encryptSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: data.user.id,
        username:
          (data.user.user_metadata?.username as string | undefined) ??
          (data.user.user_metadata?.full_name as string | undefined) ??
          cleanUsername,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, encrypted, getSessionCookieOptions());
    return response;
  } catch (reason) {
    return NextResponse.json(
      { error: reason instanceof Error ? reason.message : "Authentication failed." },
      { status: 500 }
    );
  }
}
