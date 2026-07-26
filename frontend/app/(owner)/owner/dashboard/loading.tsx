import Skeleton from "@/lib/ui/Skeleton";
import { StatCardGridSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-28" rounded="lg" />
          <Skeleton className="h-10 w-32" rounded="lg" />
        </div>
      </div>
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-4 h-5 w-56" />
          <StatCardGridSkeleton count={4} />
        </div>
        <div>
          <Skeleton className="mb-4 h-5 w-56" />
          <StatCardGridSkeleton count={4} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex h-96 items-center justify-center rounded-3xl border border-gray-100 bg-white p-6 lg:col-span-2">
            <Skeleton className="h-64 w-full" rounded="lg" />
          </div>
          <div className="flex h-96 items-center justify-center rounded-3xl border border-gray-100 bg-white p-6">
            <Skeleton className="h-48 w-48" rounded="full" />
          </div>
        </div>
      </div>
    </div>
  );
}
