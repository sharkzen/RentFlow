import LoginForm from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "เข้าสู่ระบบ",
};

export default async function page() {
  return (
    <>
      <LoginForm />
    </>
  );
}
