import TenantNavbar from "@/components/Tenant/TenantNavbar";
import TenantProvider from "./TenantProvider";
import TenantAnnouncementModal from "@/components/Tenant/TenantAnnouncementModal";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TenantProvider>
        <div className="flex min-h-screen bg-white">
          <TenantNavbar />
          <main className="flex-1 overflow-hidden p-4 md:p-8">{children}</main>
        </div>
      </TenantProvider>
      <TenantAnnouncementModal />
    </>
  );
}
