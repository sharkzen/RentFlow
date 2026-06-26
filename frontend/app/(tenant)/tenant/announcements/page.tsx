import React from "react";
import AnnouncementHistoryClient from "@/components/Tenant/announcement/AnnouncementHistoryClient";

export default function AnnouncementHistoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        ประวัติการประกาศ
      </h1>

      <AnnouncementHistoryClient />
    </div>
  );
}
