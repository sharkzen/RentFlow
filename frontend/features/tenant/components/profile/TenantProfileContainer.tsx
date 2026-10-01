import TenantProfileInfo from "./TenantProfileInfo";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";

export default function TenantProfileContainer() {
  return (
    <div className="flex w-full flex-col gap-6">
      <TenantProfileInfo />
      <ChangePasswordForm />
    </div>
  );
}
