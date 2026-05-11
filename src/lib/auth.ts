import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "rp_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  username: string;
  exp: number;
};

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function timingSafeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function signValue(value: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
}

export function createSessionToken(username: string): string {
  const secret = getRequiredEnv("AUTH_SECRET");

  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token?: string | null
): SessionPayload | null {
  if (!token) return null;

  const secret = getRequiredEnv("AUTH_SECRET");
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  const expected = signValue(encodedPayload, secret);

  if (!timingSafeEqualString(signature, expected)) return null;

  try {
    const payloadText = Buffer.from(
      encodedPayload,
      "base64url"
    ).toString("utf-8");

    const payload = JSON.parse(payloadText) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }

  return session;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}