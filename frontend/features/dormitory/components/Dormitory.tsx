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
      <div className="flex w-full flex-col items-center justify-center border border-dashed border-slate-300 bg-white/50 py-32 text-center sm:rounded-3xl">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-8 ring-slate-100/50">
          <Frown className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          ไม่พบหอพักที่คุณค้นหา
        </h3>
        <p className="mt-2 max-w-md text-slate-500">
          ลองปรับเปลี่ยนคำค้นหา เลือกทำเลอื่น หรือลบตัวกรองออก
          เพื่อดูหอพักเพิ่มเติม
        </p>
      </div>
    );
  }

  return (
    <Element name="dorm-results" className="w-full">
      <div suppressHydrationWarning data-aos="fade-up" className="w-full">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 px-2 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                หอพักแนะนำ
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              เราคัดสรรหอพักคุณภาพดี ในทำเลที่คุณต้องการ
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-500">
              ทั้งหมด <span className="font-bold text-slate-900">{total}</span>{" "}
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
              />
            );
          })}
        </div>
      </div>
    </Element>
  );
}
