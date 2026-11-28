import { NextResponse } from "next/server";
import { validateUsername } from "@/lib/account-validation";
import { getSessionFromRequest, usernameToEmail } from "@/lib/auth-session";
import {
  createAdminServerSupabase,
  createAnonServerSupabase,
  getRequestUser,
  jsonError,
} from "@/lib/supabase-server";

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!("supabase" in auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    full_name?: unknown;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const hasUsername = typeof body.username === "string";
  const hasFullName = typeof body.full_name === "string";

  if (!hasUsername && !hasFullName) {
    return NextResponse.json({ error: "No account fields provided." }, { status: 400 });
  }

  let nextUsername: string | undefined;
  let nextEmail: string | undefined;

  if (hasUsername) {
    const check = validateUsername(body.username as string);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    nextUsername = check.normalized;
    nextEmail = usernameToEmail(nextUsername);

    // Check uniqueness across profiles (case-insensitive)
    const { data: existingProfile, error: lookupError } = await auth.supabase
      .from("profiles")
      .select("id")
      .ilike("username", nextUsername)
      .neq("id", auth.user.id)
      .maybeSingle();

    if (lookupError && !lookupError.message?.includes("column")) {
      return jsonError(lookupError, 500);
    }

    if (existingProfile) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
  }

  const nextFullName = hasFullName ? (body.full_name as string).trim() : undefined;

  const nextUserMetadata: Record<string, unknown> = {
    ...(auth.user.user_metadata ?? {}),
  };
  if (nextUsername !== undefined) {
    nextUserMetadata.username = nextUsername;
  }
  if (nextFullName !== undefined) {
    nextUserMetadata.full_name = nextFullName;
  }

  // Update Supabase Auth (email mapping + user_metadata)
  const currentEmail = auth.user.email ?? "";
  const emailChanged = nextEmail !== undefined && nextEmail !== currentEmail;

  if (process.env.SUPABASE_SECRET_KEY) {
    const admin = createAdminServerSupabase();
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(auth.user.id, {
      ...(emailChanged ? { email: nextEmail, email_confirm: true } : {}),
      user_metadata: nextUserMetadata,
    });

    if (authUpdateError) {
      const msg = authUpdateError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists")) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
    }
  } else {
    const cookieSession = getSessionFromRequest(request);
    if (cookieSession) {
      const client = createAnonServerSupabase();
      await client.auth.setSession({
        access_token: cookieSession.access_token,
        refresh_token: cookieSession.refresh_token,
      });
      const { error: authUpdateError } = await client.auth.updateUser({
        ...(emailChanged ? { email: nextEmail } : {}),
        data: nextUserMetadata,
      });
      if (authUpdateError) {
        const msg = authUpdateError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("duplicate") || msg.includes("exists")) {
          return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
        }
        return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
      }
    }
  }

  // Synchronize profiles table
  const profileUpdates: Record<string, unknown> = {};
  if (nextUsername !== undefined) profileUpdates.username = nextUsername;
  if (nextFullName !== undefined) profileUpdates.full_name = nextFullName;

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await auth.supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", auth.user.id);

    if (profileError && !profileError.message?.includes("column")) {
      const msg = profileError.message.toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      return jsonError(profileError, 500);
    }
  }

  return NextResponse.json({
    id: auth.user.id,
    username:
      nextUsername ??
      (nextUserMetadata.username as string | undefined) ??
      "",
    full_name:
      nextFullName ??
      (nextUserMetadata.full_name as string | undefined) ??
      null,
  });
}
