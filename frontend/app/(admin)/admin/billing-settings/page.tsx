import React from "react";
import BillingSettingsForm from "@/features/billing/components/admin/BillingSettingsForm";

export const metadata = {
  title: "ตั้งค่าการเงิน",
};

export default function BillingSettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      <BillingSettingsForm />
    </div>
  );
}
