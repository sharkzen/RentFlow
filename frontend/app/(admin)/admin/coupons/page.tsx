import React from "react";
import CouponManager from "@/features/billing/components/admin/CouponManager";

export const metadata = {
  title: "คูปองและโปรโมชั่น",
};

export default function CouponsPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl">
        <CouponManager />
      </div>
    </div>
  );
}
