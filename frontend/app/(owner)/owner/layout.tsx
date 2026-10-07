import OwnerNavbar from "@/features/owner/components/OwnerNavbar";
import { redirect } from "next/navigation";
import { Role, Status } from "@/features/auth";
import { fetchCurrentUser } from "@/lib/auth/requireRole";
import FormPending from "@/lib/ui/status/FormPending";
import FormBanned from "@/lib/ui/status/FormBanned";
import { OwnerBillingProvider } from "@/features/billing/context/OwnerBillingContext";
import OwnerAccessGate from "@/features/billing/components/owner/OwnerAccessGate";
import OwnerBillingNotices from "@/features/billing/components/owner/OwnerBillingNotices";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchCurrentUser();

  if (me.role === Role.TENANT) redirect("/tenant/dashboard");

  if (me.status === Status.PENDING) return <FormPending />;

  if (me.status === Status.BANNED) return <FormBanned />;

  const allowedRoles = [Role.OWNER, Role.STAFF];

  if (!allowedRoles.includes(me.role as Role)) redirect("/");

  return (
    <OwnerBillingProvider>
      <div className="bg-background flex min-h-screen">
        <OwnerNavbar />
        <main className="flex-1 overflow-hidden p-4 md:p-8">
          <OwnerAccessGate>{children}</OwnerAccessGate>
        </main>
      </div>
      <OwnerBillingNotices />
    </OwnerBillingProvider>
  );
}
