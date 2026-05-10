import { existsSync, readFileSync } from "node:fs";

function loadEnvFileToProcessEnv(path: string) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFileToProcessEnv(".env");
loadEnvFileToProcessEnv("/app/.env");

const SESSION_COOKIE_NAME = "rp_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  username: string;
  exp: number;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function toBase64UrlFromBytes(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToBytes(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function timingSafeEqualString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return toBase64UrlFromBytes(new Uint8Array(signature));
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = getRequiredEnv("AUTH_SECRET");
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadBytes = textEncoder.encode(JSON.stringify(payload));
  const encodedPayload = toBase64UrlFromBytes(payloadBytes);
  const signature = await signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;

  const secret = getRequiredEnv("AUTH_SECRET");
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  const expected = await signValue(encodedPayload, secret);
  if (!timingSafeEqualString(signature, expected)) return null;

  try {
    const payloadText = textDecoder.decode(fromBase64UrlToBytes(encodedPayload));
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
