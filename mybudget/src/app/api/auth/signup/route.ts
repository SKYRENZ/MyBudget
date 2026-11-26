import { NextResponse } from "next/server";
import {
  encryptSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  usernameToEmail,
} from "@/lib/auth-session";
import { createAnonServerSupabase, createServerSupabase } from "@/lib/supabase-server";

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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const email = usernameToEmail(cleanUsername);
    const supabase = createAnonServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: cleanUsername,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user && data.session) {
      const authedClient = createServerSupabase(data.session.access_token);
      await authedClient
        .from("profiles")
        .upsert({ id: data.user.id, full_name: cleanUsername });

      const encrypted = encryptSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });

      const response = NextResponse.json({
        authenticated: true,
        user: {
          id: data.user.id,
          username: cleanUsername,
        },
      });
      response.cookies.set(SESSION_COOKIE_NAME, encrypted, getSessionCookieOptions());
      return response;
    }

    return NextResponse.json({
      authenticated: false,
      message: "Account created. Please sign in with your username and password.",
    });
  } catch (reason) {
    return NextResponse.json(
      { error: reason instanceof Error ? reason.message : "Authentication failed." },
      { status: 500 }
    );
  }
}
