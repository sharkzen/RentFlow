"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { DormSlugResponse } from "@/features/dormitory/types";
import { DormHeroSlider } from "./DormHeroSlider";
import { DormContent } from "./DormContent";
import { DormSidebar } from "./DormSidebar";
import { DormMap } from "./DormMap";
import log from "@/lib/logger";

const DormSlugSkeleton = () => (
  <div className="mx-auto max-w-7xl animate-pulse space-y-8 p-4 pt-8">
    <div className="h-125 w-full rounded-2xl bg-slate-100" />
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="h-8 w-1/2 rounded-full bg-slate-100" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-full bg-slate-50" />
          <div className="h-4 w-5/6 rounded-full bg-slate-50" />
        </div>
        <div className="mt-8 h-64 w-full rounded-2xl bg-slate-100" />
      </div>
      <div className="h-96 w-full rounded-2xl bg-slate-100" />
    </div>
  </div>
);

export default function DormSlugContainer() {
  const { slug } = useParams<{ slug: string }>();
  const decodedSlug = decodeURIComponent(slug);
  const [dorm, setDorm] = useState<DormSlugResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchDorm = useCallback(async () => {
    try {
      setLoading(true);
      const res = await DormService.getDormBySlug(decodedSlug);
      if (res) setDorm(res);
    } catch (error) {
      log.error(error);
    } finally {
      setLoading(false);
    }
  }, [decodedSlug]);

  useEffect(() => {
    fetchDorm();
  }, [fetchDorm]);

  if (loading || !dorm) return <DormSlugSkeleton />;

  return (
    // ใช้สีพื้นหลังขาว clean ตัดกับ content เล็กน้อย
    <main className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Slider แบบไร้ขอบมนเกินไป ให้ดู Modern */}
        <section className="mb-10 w-full overflow-hidden rounded-2xl bg-slate-50">
          <DormHeroSlider images={dorm.images} />
        </section>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Content (Left) */}
          <div className="order-2 space-y-12 lg:order-1 lg:col-span-8">
            <DormContent data={dorm} />

            {/* Map Section - Clean wrapper */}
            <div className="rounded-2xl border border-slate-100 p-1">
              <DormMap
                latitude={dorm.latitude}
                longitude={dorm.longitude}
                mapUrl={dorm.mapUrl}
                address={dorm.address}
              />
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="order-1 lg:order-2 lg:col-span-4">
            <div className="sticky top-24 z-10">
              <DormSidebar data={dorm} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
