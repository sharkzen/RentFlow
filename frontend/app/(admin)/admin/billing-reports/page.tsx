import React from "react";
import RevenueReport from "@/features/billing/components/admin/RevenueReport";

export const metadata = {
  title: "รายงานรายได้",
};

export default function BillingReportsPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl">
        <RevenueReport />
      </div>
    </div>
  );
}
