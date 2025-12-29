"use client";

import DormCard from "./DormCard";
import { Element } from "react-scroll";
export default function Dormitory({ dorms }: { dorms: any[] }) {
  if (!dorms || dorms.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        ไม่พบหอพักที่ตรงกับเงื่อนไขที่ค้นหา
      </div>
    );
  }

  return (
    <Element name="dorm-results" className="min-h-screen">
      <div suppressHydrationWarning data-aos="fade-up" className="min-h-screen">
        <div className="max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                หอพักแนะนำสำหรับคุณ
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                พบทั้งหมด {dorms.length} รายการ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {dorms.map((dorm) => {
              const coverImage =
                dorm.images?.find((img: any) => img.isCover)?.url ||
                dorm.images?.[0]?.url ||
                null;

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
      </div>
    </Element>
  );
}
