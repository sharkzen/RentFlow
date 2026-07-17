import { AuthProvider } from "@/lib/providers/AuthProvider";
import { getCurrentUser } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <AuthProvider initialUser={user}>{children}</AuthProvider>
    </>
  );
}
