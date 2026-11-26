import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "mybudget_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

function getSessionSecretKey(): Buffer {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET or SUPABASE_SECRET_KEY");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSession(session: StoredSession): string {
  const key = getSessionSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(session), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSession(token: string): StoredSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [ivPart, tagPart, dataPart] = parts;
    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const ciphertext = Buffer.from(dataPart, "base64url");

    const key = getSessionSecretKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(decrypted) as Partial<StoredSession>;

    if (!parsed.access_token || !parsed.refresh_token) return null;
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
    };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name) continue;
    try {
      result[name] = decodeURIComponent(value);
    } catch {
      result[name] = value;
    }
  }
  return result;
}

export function getSessionFromRequest(request: Request): StoredSession | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = cookies[SESSION_COOKIE_NAME];
  if (!raw) return null;
  return decryptSession(raw);
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export function usernameToEmail(username: string): string {
  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${slug}@mybudget.app`;
}
