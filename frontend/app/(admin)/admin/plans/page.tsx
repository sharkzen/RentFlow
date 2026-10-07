import React from "react";
import PlanManager from "@/features/billing/components/admin/PlanManager";

export const metadata = {
  title: "แพ็คเกจ (Plans)",
};

export default function PlansPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl">
        <PlanManager />
      </div>
    </div>
  );
}
