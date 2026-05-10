import { getSessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

function isHtmlNavigationRequest(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function buildLogoutCookie() {
  const isProduction = process.env.NODE_ENV === "production";
  const parts = [
    `${getSessionCookieName()}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProduction ? "Secure" : "",
  ].filter(Boolean);

  return parts.join("; ");
}

export async function POST(request: Request) {
  const setCookie = buildLogoutCookie();

  if (isHtmlNavigationRequest(request)) {
    const response = Response.redirect(new URL("/admin/login", request.url), 303);
    response.headers.append("Set-Cookie", setCookie);
    return response;
  }

  const response = Response.json({ ok: true, message: "logout_ok" }, { status: 200 });
  response.headers.append("Set-Cookie", setCookie);
  return response;
}
