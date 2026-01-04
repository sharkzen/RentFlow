"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DormService } from "@/features/dormitory/services/dorm.service";
import { DormSlugResponse } from "@/features/dormitory/types";
import { Loader2 } from "lucide-react";

import { DormHeroSlider } from "./DormHeroSlider";
import { DormContent } from "./DormContent";
import { DormSidebar } from "./DormSidebar";
import { DormMap } from "./DormMap";

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
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [decodedSlug]);

  useEffect(() => {
    fetchDorm();
  }, [fetchDorm]);

  if (!dorm) return null;

  return (
    <main className="min-h-screen bg-white pb-20">
      <section className="w-full">
        <DormHeroSlider images={dorm.images} />
      </section>

      <div className="mx-auto max-w-375 p-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="sticky top-24">
              <DormSidebar data={dorm} />
            </div>
          </div>

          <div className="order-2 lg:order-1 lg:col-span-2">
            <DormContent data={dorm} />

            <DormMap
              latitude={dorm.latitude}
              longitude={dorm.longitude}
              mapUrl={dorm.mapUrl}
              address={dorm.address}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
