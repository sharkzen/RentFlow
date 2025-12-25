import { cookies } from "next/headers";
import type { User } from "@/features/auth";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("access_token")?.value;

    if (!token) return null;

    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}
