import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { redirect } from "next/navigation";
import { Role } from "@/features/auth";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const baseUrl = process.env.API_URL || "http://localhost:3001";
    const me = await fetchWithRefresh(`${baseUrl}/api/auth/me`);

    if ((me.role as Role) !== Role.ADMIN) redirect("/403");

    return (
      <AuthProvider>
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">
            {children}
          </main>
        </div>
      </AuthProvider>
    );
  } catch (error) {
    redirect("/auth/login");
  }
}
