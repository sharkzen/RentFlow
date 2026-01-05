"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { DormSlugResponse } from "@/features/dormitory/types";
import { DormHeroSlider } from "./DormHeroSlider";
import { DormContent } from "./DormContent";
import { DormSidebar } from "./DormSidebar";
import { DormMap } from "./DormMap";

const DormSlugSkeleton = () => (
  <div className="mx-auto max-w-7xl animate-pulse space-y-8 p-4 pt-8">
    <div className="h-100 w-full rounded-3xl bg-slate-200" />
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-10 w-3/4 rounded-full bg-slate-200" />
        <div className="h-4 w-full rounded-full bg-slate-100" />
        <div className="h-4 w-5/6 rounded-full bg-slate-100" />
        <div className="mt-8 h-64 w-full rounded-3xl bg-slate-200" />
      </div>
      <div className="h-96 w-full rounded-3xl bg-slate-200" />
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
      if (res) {
        setDorm(res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [decodedSlug]);

  useEffect(() => {
    fetchDorm();
  }, [fetchDorm]);

  if (loading || !dorm) return <DormSlugSkeleton />;

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-8 w-full overflow-hidden rounded-3xl shadow-sm">
          <DormHeroSlider images={dorm.images} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="order-2 space-y-10 lg:order-1 lg:col-span-2">
            <DormContent data={dorm} />

            <DormMap
              latitude={dorm.latitude}
              longitude={dorm.longitude}
              mapUrl={dorm.mapUrl}
              address={dorm.address}
            />
          </div>

          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="sticky top-24 z-10">
              <DormSidebar data={dorm} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
