import React from "react";
import OwnerBillingContainer from "@/features/billing/components/owner/OwnerBillingContainer";

export const metadata = {
  title: "แพ็คเกจและการชำระเงิน",
};

export default function OwnerBillingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <OwnerBillingContainer />
    </div>
  );
}
