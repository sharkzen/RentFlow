"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { scroller } from "react-scroll";
import { DormService } from "@/features/dormitory/services/dorm.service";
import Dormitory from "@/features/dormitory/components/Dormitory";
import Pagination from "@/components/ui/Pagination";
import DormFilter from "@/features/dormitory/components/DormFilter";

const DormSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm"
      >
        <div className="aspect-4/3 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    ))}
  </div>
);

export default function IndexContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dorms, setDorms] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search");
  const landmarkId = searchParams.get("landmarkId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  useEffect(() => {
    const fetchDorms = async () => {
      setLoading(true);
      try {
        const res = await DormService.getAllDroms({
          page,
          search,
          landmarkId,
          minPrice,
          maxPrice,
        });

        setDorms(res.data);
        setMeta({
          page: res.meta.page,
          totalPages: res.meta.totalPages,
          total: res.meta.total,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDorms();
  }, [page, search, landmarkId, minPrice, maxPrice]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    router.push(`/?${params.toString()}`, { scroll: false });

    setTimeout(() => {
      scroller.scrollTo("dorm-results", {
        duration: 500,
        smooth: "easeInOutQuart",
        offset: -100,
      });
    }, 100);
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <DormFilter />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-10">
            <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
            <DormSkeleton />
          </div>
        ) : (
          <>
            <Dormitory dorms={dorms} />

            <div className="mt-8">
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
