import { createSessionToken, getRequiredEnv, getSessionCookieName, getSessionMaxAge } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;

type AttemptState = {
  failedCount: number;
  blockedUntil: number | null;
};

const attempts = new Map<string, AttemptState>();

type ParsedCredentials = {
  username: string;
  password: string;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

function isHtmlNavigationRequest(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function buildSessionCookie(token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const parts = [
    `${getSessionCookieName()}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${getSessionMaxAge()}`,
    isProduction ? "Secure" : "",
  ].filter(Boolean);

  return parts.join("; ");
}

async function parseCredentials(request: Request): Promise<ParsedCredentials> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as { username?: unknown; password?: unknown };
      return {
        username: String(payload.username ?? "").trim(),
        password: String(payload.password ?? "").trim(),
      };
    }

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      return {
        username: String(formData.get("username") ?? "").trim(),
        password: String(formData.get("password") ?? "").trim(),
      };
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    return {
      username: String(params.get("username") ?? "").trim(),
      password: String(params.get("password") ?? "").trim(),
    };
  } catch (error) {
    console.error("[AUTH] Error parseando body de login:", error);
    throw new Error("No se pudo parsear el body de login");
  }
}

function loginErrorResponse(request: Request, kind: "credenciales" | "bloqueado" | "bad_request" | "server_error", status: number, extra?: Record<string, unknown>) {
  if (isHtmlNavigationRequest(request)) {
    const url = new URL(`/admin/login?error=${kind}`, request.url);
    return Response.redirect(url, 303);
  }

  return Response.json({ ok: false, error: kind, ...(extra ?? {}) }, { status });
}

export async function POST(request: Request) {
  try {
    const adminUsername = getRequiredEnv("ADMIN_USERNAME");
    const adminPassword = getRequiredEnv("ADMIN_PASSWORD");

    console.log("ADMIN_USERNAME:", adminUsername);
console.log("ADMIN_PASSWORD:", adminPassword);

    getRequiredEnv("AUTH_SECRET");

    const { username, password } = await parseCredentials(request);

    if (!username || !password) {
      return loginErrorResponse(request, "bad_request", 400, { message: "username y password son obligatorios" });
    }

    const ip = getClientIp(request);
    const now = Date.now();
    const state = attempts.get(ip) ?? { failedCount: 0, blockedUntil: null };

    if (state.blockedUntil && state.blockedUntil > now) {
      const retryAfterSec = Math.ceil((state.blockedUntil - now) / 1000);
      return loginErrorResponse(request, "bloqueado", 429, { retryAfterSec });
    }

    const isValid = username === adminUsername && password === adminPassword;

    if (!isValid) {
      const nextFailedCount = state.failedCount + 1;
      const blockedUntil = nextFailedCount >= MAX_FAILED_ATTEMPTS ? now + BLOCK_MINUTES * 60 * 1000 : null;
      attempts.set(ip, { failedCount: nextFailedCount, blockedUntil });

      return loginErrorResponse(request, "credenciales", 401);
    }

    attempts.set(ip, { failedCount: 0, blockedUntil: null });

    const token = await createSessionToken(username);

    if (isHtmlNavigationRequest(request)) {
      const response = Response.redirect(new URL("/admin", request.url), 303);
      response.headers.append("Set-Cookie", buildSessionCookie(token));
      return response;
    }

    const response = Response.json({ ok: true, message: "login_ok" }, { status: 200 });
    response.headers.append("Set-Cookie", buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error("[AUTH] Error en POST /api/admin/login:", error);
    return loginErrorResponse(request, "server_error", 500, {
      message: error instanceof Error ? error.message : "Error interno de autenticación",
    });
  }
}
