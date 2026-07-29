import { cookies } from "next/headers";

export async function fetchWithRefresh(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const baseUrl = process.env.API_URL || "http://localhost:3001";

  let res = await fetch(url, {
    ...options,

    headers: {
      ...options.headers,
      Cookie: cookieHeader,
    },

    cache: "no-store",
  });

  if (res.status === 401) {
    const refreshUrl = `${baseUrl}/api/auth/refresh`;

    const refreshRes = await fetch(refreshUrl, {
      method: "POST",

      headers: {
        Cookie: cookieHeader,
      },
    });

    if (refreshRes.ok) {
      const setCookieHeader = refreshRes.headers.get("set-cookie");
      let retryHeader = cookieHeader;

      if (setCookieHeader) {
        const tokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
        const newToken = tokenMatch ? tokenMatch[1] : null;

        if (newToken) {
          retryHeader = allCookies
            .map((c) =>
              c.name === "access_token"
                ? `access_token=${newToken}`
                : `${c.name}=${c.value}`,
            )
            .join("; ");
        }
      }

      res = await fetch(url, {
        ...options,

        headers: {
          ...options.headers,
          Cookie: retryHeader,
        },

        cache: "no-store",
      });
    } else {
      throw new Error("REFRESH_FAILED");
    }
  }

  if (!res.ok) {
    throw new Error(`FETCH_FAILED_${res.status}`);
  }

  return res.json();
}
