import TenantNavbar from "@/features/tenant/components/TenantNavbar";
import TenantAnnouncementModal from "@/features/announcement/components/TenantAnnouncementModal";
import TenantBanned from "./TenantBanned";
import { fetchWithRefresh } from "@/lib/api/fetchWithRefresh";
import { redirect } from "next/navigation";
import { Role, Status, type User } from "@/features/auth";

export default async function TenantLayout({
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

  if (me.role !== Role.TENANT) redirect("/");

  if (me.status === Status.BANNED) return <TenantBanned />;

  return (
    <>
      <div className="flex min-h-screen bg-white">
        <TenantNavbar />
        <main className="flex-1 overflow-hidden p-4 md:p-8">{children}</main>
      </div>
      <TenantAnnouncementModal />
    </>
  );
}
