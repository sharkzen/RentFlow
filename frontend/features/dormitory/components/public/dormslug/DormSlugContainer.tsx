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
  <main className="bg-grid bg-background min-h-screen">
    <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 pt-8 pb-20 sm:px-6 lg:px-8">
      <div className="bg-skeleton h-105 w-full rounded-3xl md:h-130" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="bg-skeleton h-9 w-2/3 rounded-full" />
          <div className="space-y-3">
            <div className="bg-skeleton h-4 w-full rounded-full" />
            <div className="bg-skeleton h-4 w-5/6 rounded-full" />
            <div className="bg-skeleton h-4 w-4/6 rounded-full" />
          </div>
          <div className="bg-skeleton mt-8 h-72 w-full rounded-2xl" />
        </div>
        <div className="bg-skeleton h-96 w-full rounded-2xl lg:col-span-4" />
      </div>
    </div>
  </main>
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
    <main className="bg-grid bg-background min-h-screen pb-20 sm:p-4">
      {/* Hero Slider - Full width, no padding */}
      <section className="w-full overflow-hidden">
        <DormHeroSlider images={dorm.images} />
      </section>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-8">
            <div className="bg-surface border-border p-6 sm:rounded-2xl sm:border sm:p-8">
              <DormContent data={dorm} />
            </div>

            <div className="bg-surface border-border p-6 sm:rounded-2xl sm:border sm:p-8">
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
