"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SearchX } from "lucide-react";
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

const DormNotFound = () => (
  <main className="bg-grid bg-background flex min-h-[70vh] items-center justify-center px-4">
    <div className="bg-surface border-border mx-auto max-w-md rounded-3xl border p-10 text-center shadow-lg">
      <SearchX className="mx-auto mb-4 h-14 w-14 text-blue-600" />
      <h1 className="text-foreground mb-2 text-2xl font-bold">ไม่พบหอพักนี้</h1>
      <p className="text-muted mb-6 text-sm">
        หอพักนี้อาจยังไม่เปิดให้บริการ ถูกปิดการเผยแพร่ หรือลิงก์ไม่ถูกต้อง
      </p>
      <Link
        href="/"
        className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
      >
        กลับไปค้นหาหอพัก
      </Link>
    </div>
  </main>
);

export default function DormSlugContainer() {
  const { slug } = useParams<{ slug: string }>();
  const decodedSlug = decodeURIComponent(slug);
  const [dorm, setDorm] = useState<DormSlugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchDorm = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await DormService.getDormBySlug(decodedSlug);
      if (res) setDorm(res);
    } catch (error) {
      log.error(error);
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [decodedSlug]);

  useEffect(() => {
    fetchDorm();
  }, [fetchDorm]);

  if (notFound) return <DormNotFound />;
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
