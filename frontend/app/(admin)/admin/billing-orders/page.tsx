import React from "react";
import OrderManager from "@/features/billing/components/admin/OrderManager";

export const metadata = {
  title: "คำสั่งซื้อและสลิป",
};

export default function BillingOrdersPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl">
        <OrderManager />
      </div>
    </div>
  );
}
