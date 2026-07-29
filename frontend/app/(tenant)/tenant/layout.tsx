import TenantNavbar from "@/features/tenant/components/TenantNavbar";
import TenantAnnouncementModal from "@/features/announcement/components/TenantAnnouncementModal";
import TenantBanned from "./TenantBanned";
import { redirect } from "next/navigation";
import { Role, Status } from "@/features/auth";
import { fetchCurrentUser } from "@/lib/auth/requireRole";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchCurrentUser();

  if (me.role !== Role.TENANT) redirect("/");

  if (me.status === Status.BANNED) return <TenantBanned />;

  return (
    <>
      <div className="bg-background flex min-h-screen">
        <TenantNavbar />
        <main className="flex-1 overflow-hidden p-4 md:p-8">{children}</main>
      </div>
      <TenantAnnouncementModal />
    </>
  );
}
