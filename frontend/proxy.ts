import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES: string[] = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/dorms"
];

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000 - 120000;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const {
    pathname
  } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.startsWith("/images/") || isPublicRoute(pathname)) {
    const accessToken = request.cookies.get("access_token")?.value;

    if (accessToken && !isTokenExpired(accessToken) && (pathname === "/auth/login" || pathname === "/auth/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
    try {
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: "POST",

        headers: {
          Cookie: `refresh_token=${refreshToken}`
        }
      });

      if (refreshRes.ok) {
        const response = NextResponse.next();
        const setCookie = refreshRes.headers.get("set-cookie");

        if (setCookie) {
          const tokenMatch = setCookie.match(/access_token=([^;]+)/);
          const newToken = tokenMatch ? tokenMatch[1] : null;

          if (newToken) {
            response.cookies.set("access_token", newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 15
            });

            if (pathname === "/auth/login" || pathname === "/auth/register") {
              return NextResponse.redirect(new URL("/", request.url));
            }

            return response;
          }
        }
      }
    } catch (error) {}
  }

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/).*)"]
};