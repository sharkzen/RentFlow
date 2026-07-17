import OwnerNavbar from "@/features/owner/components/OwnerNavbar";
import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";
import { redirect } from "next/navigation";
import { Role, Status, type User } from "@/features/auth";
import FormPending from "@/components/status/FormPending";
import FormBanned from "@/components/status/FormBanned";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let me: User;

  try {
    const baseUrl = process.env.API_URL || "http://localhost:3001";
    me = await fetchWithRefresh(`${baseUrl}/api/auth/me`);
  } catch (error) {
    redirect("/auth/login");
  }

  if (me.role === Role.TENANT) redirect("/tenant/dashboard");

  if (me.status === Status.PENDING) return <FormPending />;

  if (me.status === Status.BANNED) return <FormBanned />;

  const allowedRoles = [Role.OWNER, Role.STAFF];

  if (!allowedRoles.includes(me.role as Role)) redirect("/");

  return (
    <div className="flex min-h-screen bg-white">
      <OwnerNavbar />
      <main className="flex-1 overflow-hidden p-4 md:p-8">{children}</main>
    </div>
  );
}
