import TenantNavbar from "@/components/Tenant/TenantNavbar";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <TenantNavbar />
      <main className="flex-1 overflow-hidden p-4 md:p-8">{children}</main>
    </div>
  );
}
