import { AuthProvider } from "@/lib/providers/AuthProvider";
import { Role } from "@/features/auth";
import { requireRole } from "@/lib/auth/requireRole";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole([Role.ADMIN], "/403");

  return (
    <AuthProvider>
      <div className="bg-background flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
