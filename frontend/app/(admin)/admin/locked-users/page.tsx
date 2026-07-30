import { LockedUsersController } from "@/features/admin";
import React from "react";

export const metadata = {
  title: "บัญชีที่ถูกล็อค",
};

export default function page() {
  return (
    <div>
      <LockedUsersController />
    </div>
  );
}
