import { fetchWithRefresh } from "@/utils/fetchWithRefresh";
import { AuthProvider } from "@/context/AuthProvider";
import { redirect } from "next/navigation";
import { Role } from "@/features/auth";
import AdminSidebar from "@/components/Admin/AdminSidebar";

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
