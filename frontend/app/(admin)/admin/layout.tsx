import { fetchWithRefresh } from "@/utils/fetchWithRefresh";
import { AuthProvider } from "@/context/AuthProvider";
import { redirect } from "next/navigation";
import { Role } from "@/features/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const me = await fetchWithRefresh(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
    );

    if ((me.role as Role) !== Role.ADMIN) redirect("/403");

    return <AuthProvider initialUser={me}>{children}</AuthProvider>;
  } catch (error) {
    redirect("/auth/login");
  }
}
