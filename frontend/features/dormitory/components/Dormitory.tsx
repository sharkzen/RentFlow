"use client";
import DormCard from "./DormCard";
import { Element } from "react-scroll";
import { Home, Sparkles, Frown } from "lucide-react";

interface DormitoryProps {
  dorms: any[];
  total?: number;
}

export default function Dormitory({ dorms, total = 0 }: DormitoryProps) {
  if (!dorms || dorms.length === 0) {
    return (
      <div className="border-border bg-surface/50 flex w-full flex-col items-center justify-center border border-dashed py-32 text-center sm:rounded-3xl">
        <div className="bg-background mb-6 flex h-20 w-20 items-center justify-center rounded-full ring-8 ring-black/5">
          <Frown className="text-muted h-10 w-10" />
        </div>
        <h3 className="text-foreground text-xl font-bold">
          ไม่พบหอพักที่คุณค้นหา
        </h3>
        <p className="text-muted mt-2 max-w-md">
          ลองปรับเปลี่ยนคำค้นหา เลือกทำเลอื่น หรือลบตัวกรองออก
          เพื่อดูหอพักเพิ่มเติม
        </p>
      </div>
    );
  }

  return (
    <Element name="dorm-results" className="w-full">
      <div suppressHydrationWarning data-aos="fade-up" className="w-full">
        <div className="border-border mb-8 flex flex-col gap-4 border-b px-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                หอพักแนะนำ
              </h2>
            </div>
            <p className="text-muted mt-1 text-sm">
              เราคัดสรรหอพักคุณภาพดี ในทำเลที่คุณต้องการ
            </p>
          </div>
          <div className="text-right">
            <span className="text-muted text-sm font-medium">
              ทั้งหมด <span className="text-foreground font-bold">{total}</span>{" "}
              รายการ
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dorms.map((dorm) => {
            const coverImage =
              dorm.images?.find((img: any) => img.isCover)?.url ||
              dorm.images?.[0]?.url ||
              "https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image";
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
                availabilityStatus={dorm.availabilityStatus}
                isFeatured={dorm.isFeatured}
                isPromoted={dorm.isPromoted}
              />
            );
          })}
        </div>
      </div>
    </Element>
  );
}
