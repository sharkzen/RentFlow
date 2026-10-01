import FormProfile from "./FormProfile";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";

export default function ProfileContainer() {
  return (
    <div className="flex w-full flex-col gap-6">
      <FormProfile />
      <ChangePasswordForm />
    </div>
  );
}
