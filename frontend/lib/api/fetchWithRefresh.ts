import { cookies } from "next/headers";

// Server Component ไม่มี browser cookie jar เหมือน client-side axios instance
// (lib/api/api-client.ts) จึงต้อง forward/parse cookie เองแบบนี้ — ทั้งสองไฟล์
// แก้ปัญหาเดียวกัน (retry หลัง refresh token) คนละ runtime กัน ไม่ใช่โค้ดซ้ำที่รวมได้ตรงๆ
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
      // เก็บ cookie เดิมทั้งหมดไว้ แล้วแทนที่แค่ access_token ตัวใหม่ กัน cookie
      // อื่น (เช่น refresh_token เดิม) หายไปจาก retry request เหมือนที่เคยเป็น
      let retryHeader = cookieHeader;

      if (setCookieHeader) {
        const tokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
        const newToken = tokenMatch ? tokenMatch[1] : null;

        if (newToken) {
          retryHeader = allCookies
            .map((c) =>
              c.name === "access_token" ? `access_token=${newToken}` : `${c.name}=${c.value}`,
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
