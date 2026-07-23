import UserController from "@/features/admin/components/user/UserController";
import React from "react";

export const metadata = {
  title: "จัดการผู้ใช้งาน",
};

export default function page() {
  return (
    <div>
      <UserController />
    </div>
  );
}
