import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES: string[] = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/dorms",
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
  const { pathname } = request.nextUrl;

  // 1️⃣ public + asset → ผ่านทันที
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    isPublicRoute(pathname)
  ) {
    const accessToken = request.cookies.get("access_token")?.value;

    // login/register แต่มี token → เด้งกลับ home
    if (
      accessToken &&
      !isTokenExpired(accessToken) &&
      (pathname === "/auth/login" || pathname === "/auth/register")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // 2️⃣ protected route
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
    try {
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        {
          method: "POST",
          headers: {
            Cookie: `refresh_token=${refreshToken}`,
          },
        },
      );

      if (refreshRes.ok) {
        const response = NextResponse.next();
        const setCookie = refreshRes.headers.get("set-cookie");

        if (setCookie) {
          const tokenMatch = setCookie.match(/access_token=([^;]+)/);
          const newToken = tokenMatch?.[1];

          if (newToken) {
            response.cookies.set("access_token", newToken, {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 15,
            });
            return response;
          }
        }
      }
    } catch {}
  }

  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/auth/login", request.url);

    // เก็บ path + query เดิม
    const redirectPath = request.nextUrl.pathname + request.nextUrl.search;

    loginUrl.searchParams.set("redirect", encodeURIComponent(redirectPath));

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/).*)"],
};
