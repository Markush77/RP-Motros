import {
  createSessionToken,
  getRequiredEnv,
  getSessionCookieName,
  getSessionMaxAge,
} from "@/lib/auth";

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
  const contentType =
    request.headers.get("content-type")?.toLowerCase() ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as {
        username?: unknown;
        password?: unknown;
      };
      return {
        username: String(payload.username ?? "").trim(),
        password: String(payload.password ?? "").trim(),
      };
    }

    const formData = await request.formData();
    return {
      username: String(formData.get("username") ?? "").trim(),
      password: String(formData.get("password") ?? "").trim(),
    };
  } catch (error) {
    console.error("[AUTH] Error parseando body:", error);
    throw new Error("No se pudo parsear el body");
  }
}

function redirectWithLocation(path: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: path,
    },
  });
}

export async function POST(request: Request) {
  try {
    const adminUsername = getRequiredEnv("ADMIN_USERNAME");
    const adminPassword = getRequiredEnv("ADMIN_PASSWORD");
    getRequiredEnv("AUTH_SECRET");

    const { username, password } = await parseCredentials(request);

    if (!username || !password) {
      return redirectWithLocation("/admin/login?error=bad_request");
    }

    const ip = getClientIp(request);
    const now = Date.now();
    const state =
      attempts.get(ip) ?? { failedCount: 0, blockedUntil: null };

    if (state.blockedUntil && state.blockedUntil > now) {
      return redirectWithLocation("/admin/login?error=bloqueado");
    }

    const isValid =
      username === adminUsername &&
      password === adminPassword;

    if (!isValid) {
      const nextFailedCount = state.failedCount + 1;
      const blockedUntil =
        nextFailedCount >= MAX_FAILED_ATTEMPTS
          ? now + BLOCK_MINUTES * 60 * 1000
          : null;

      attempts.set(ip, {
        failedCount: nextFailedCount,
        blockedUntil,
      });

      return redirectWithLocation("/admin/login?error=credenciales");
    }

    attempts.set(ip, { failedCount: 0, blockedUntil: null });

    const token = createSessionToken(username);
    const cookieHeader = buildSessionCookie(token);

    const response = new Response(null, {
      status: 303,
      headers: {
        Location: "/admin",
      },
    });

    response.headers.append("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    console.error("[AUTH] Error en login:", error);
    return redirectWithLocation("/admin/login?error=server_error");
  }
}