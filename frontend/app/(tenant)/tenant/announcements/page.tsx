import React from "react";
import AnnouncementHistoryClient from "@/features/announcement/components/AnnouncementHistoryClient";

export const metadata = {
  title: "ประวัติการประกาศ",
};

export default function AnnouncementHistoryPage() {
  return (
    <div>
      <h1 className="text-foreground mb-6 text-2xl font-bold">
        ประวัติการประกาศ
      </h1>
      <AnnouncementHistoryClient />
    </div>
  );
}
