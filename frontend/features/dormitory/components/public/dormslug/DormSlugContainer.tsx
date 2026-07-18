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
  <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 pt-8 pb-20 sm:px-6 lg:px-8">
    <div className="h-105 w-full rounded-3xl bg-slate-100 md:h-130" />
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="h-9 w-2/3 rounded-full bg-slate-100" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded-full bg-slate-50" />
          <div className="h-4 w-5/6 rounded-full bg-slate-50" />
          <div className="h-4 w-4/6 rounded-full bg-slate-50" />
        </div>
        <div className="mt-8 h-72 w-full rounded-2xl bg-slate-100" />
      </div>
      <div className="h-96 w-full rounded-2xl bg-slate-100 lg:col-span-4" />
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
    <main className="min-h-screen bg-slate-50 pb-20 sm:p-4">
      {/* Hero Slider - Full width, no padding */}
      <section className="w-full overflow-hidden">
        <DormHeroSlider images={dorm.images} />
      </section>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-8">
            <div className="bg-white p-6 sm:rounded-2xl sm:p-8">
              <DormContent data={dorm} />
            </div>

            <div className="bg-white p-6 sm:rounded-2xl sm:p-8">
              <DormMap
                latitude={dorm.latitude}
                longitude={dorm.longitude}
                mapUrl={dorm.mapUrl}
                address={dorm.address}
              />
            </div>
          </div>

          {/* Sidebar */}
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
