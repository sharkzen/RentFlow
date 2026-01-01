"use client";

import DormCard from "./DormCard";
import { Element } from "react-scroll";
import { Home } from "lucide-react";

export default function Dormitory({ dorms }: { dorms: any[] }) {
  if (!dorms || dorms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="rounded-full bg-gray-100 p-6">
          <Home className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          ไม่พบหอพักที่คุณค้นหา
        </h3>
        <p className="mt-2 text-gray-500">
          ลองปรับเปลี่ยนตัวเลือกการค้นหาหรือลบตัวกรองดูนะครับ
        </p>
      </div>
    );
  }

  return (
    <Element name="dorm-results" className="w-full">
      <div suppressHydrationWarning data-aos="fade-up" className="w-full">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              หอพักแนะนำสำหรับคุณ
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {dorms.map((dorm) => {
            const coverImage =
              dorm.images?.find((img: any) => img.isCover)?.url ||
              dorm.images?.[0]?.url ||
              "https://placehold.co/600x400?text=No+Image";

            const locationName = dorm.nearby
              ? `ใกล้ ${dorm.nearby.name}`
              : dorm.address || "ไม่ระบุที่ตั้ง";

            const distanceText = dorm.nearby?.distanceText;

            return (
              <DormCard
                key={dorm.id}
                slug={dorm.slug}
                image={coverImage}
                title={dorm.name}
                location={locationName}
                distance={distanceText}
                price={dorm.settings?.roomPrice || 0}
              />
            );
          })}
        </div>
      </div>
    </Element>
  );
}
