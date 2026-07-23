import React from "react";
import FeatureManager from "@/features/feature/components/FeatureManager";

export const metadata = {
  title: "จัดการฟีเจอร์ (Features)",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <FeatureManager />
      </div>
    </div>
  );
}
