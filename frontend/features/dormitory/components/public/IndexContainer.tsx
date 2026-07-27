"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { scroller } from "react-scroll";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { DormService } from "@/features/dormitory/services/dorm.service";
import Dormitory from "@/features/dormitory/components/Dormitory";
import Pagination from "@/lib/ui/Pagination";
import DormFilter from "@/features/dormitory/components/DormFilter";

const DormSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="aspect-4/3 w-full animate-pulse bg-slate-200" />
        <div className="space-y-3 p-4">
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 flex items-center justify-between">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function IndexContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search");
  const landmarkId = searchParams.get("landmarkId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const { data, isLoading } = useQuery({
    queryKey: [
      "dorms",
      "public",
      { page, search, landmarkId, minPrice, maxPrice },
    ],
    queryFn: () =>
      DormService.getAllDroms({ page, search, landmarkId, minPrice, maxPrice }),

    placeholderData: keepPreviousData,
  });

  const dorms = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, total: 0 };
  const loading = isLoading;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());

    router.push(`/?${params.toString()}`, {
      scroll: false,
    });

    setTimeout(() => {
      scroller.scrollTo("dorm-results", {
        duration: 800,
        delay: 0,
        smooth: "easeInOutQuart",
        offset: -120,
      });
    }, 100);
  };

  return (
    <main className="min-h-screen w-full bg-[#F3F4F6] pb-24">
      <div className="mx-auto sm:px-4">
        <div className="py-6">
          <DormFilter />
        </div>
        <div className="min-h-125">
          {loading ? (
            <div className="py-4">
              <div className="mb-8 flex items-center justify-between">
                <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
              <DormSkeleton />
            </div>
          ) : (
            <>
              <Dormitory dorms={dorms} total={meta.total} />
              {dorms.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
