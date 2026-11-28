import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/account-validation";
import {
  encryptSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  usernameToEmail,
} from "@/lib/auth-session";
import {
  createAdminServerSupabase,
  createAnonServerSupabase,
  getRequestUser,
} from "@/lib/supabase-server";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  const currentPassword = body?.currentPassword ?? "";
  const newPassword = body?.newPassword ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return NextResponse.json({ error: strength.error }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from your current password." },
      { status: 400 },
    );
  }

  // Verify current password against Supabase Auth
  const currentUsername = (auth.user.user_metadata?.username as string | undefined) ?? "";
  const currentEmail = auth.user.email ?? (currentUsername ? usernameToEmail(currentUsername) : "");

  if (!currentEmail) {
    return NextResponse.json(
      { error: "Unable to verify current account credentials." },
      { status: 400 },
    );
  }

  const anonClient = createAnonServerSupabase();
  const { data: verified, error: verifyError } = await anonClient.auth.signInWithPassword({
    email: currentEmail,
    password: currentPassword,
  });

  if (verifyError || !verified.session) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  // Update password using Supabase Auth APIs
  if (process.env.SUPABASE_SECRET_KEY) {
    const admin = createAdminServerSupabase();
    const { error: updateError } = await admin.auth.admin.updateUserById(auth.user.id, {
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  } else {
    const { error: updateError } = await anonClient.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  // Re-sign in with the new password so the session cookie stays valid and fresh
  const { data: freshSignIn } = await anonClient.auth.signInWithPassword({
    email: currentEmail,
    password: newPassword,
  });

  const response = NextResponse.json({ ok: true, message: "Password updated successfully." });

  if (freshSignIn?.session) {
    const encrypted = encryptSession({
      access_token: freshSignIn.session.access_token,
      refresh_token: freshSignIn.session.refresh_token,
      expires_at: freshSignIn.session.expires_at,
    });
    response.cookies.set(SESSION_COOKIE_NAME, encrypted, getSessionCookieOptions());
  }

  return response;
}
