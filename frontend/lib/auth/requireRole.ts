import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";
import { redirect } from "next/navigation";
import { Role, type User } from "@/features/auth";

export async function fetchCurrentUser(): Promise<User> {
  try {
    const baseUrl = process.env.API_URL || "http://localhost:3001";
    return await fetchWithRefresh(`${baseUrl}/api/auth/me`);
  } catch {
    redirect("/auth/login");
  }
}

export async function requireRole(
  allowedRoles: Role[],
  redirectTo: string,
): Promise<User> {
  const me = await fetchCurrentUser();

  if (!allowedRoles.includes(me.role as Role)) redirect(redirectTo);

  return me;
}
