import Skeleton from "@/lib/ui/Skeleton";
import { StatCardGridSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" rounded="md" />
          <Skeleton className="h-5 w-72" rounded="md" />
          <Skeleton className="h-5 w-20" rounded="md" />
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-28" rounded="lg" />
          <Skeleton className="h-10 w-32" rounded="lg" />
        </div>
      </div>
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-4 h-6 w-56" />
          <StatCardGridSkeleton count={4} />
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-56" />
          <StatCardGridSkeleton count={4} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border-border bg-surface flex h-96 flex-col items-center justify-center rounded-3xl border p-6 lg:col-span-2">
            <Skeleton className="h-[280px] w-full" rounded="lg" />
            <Skeleton className="mt-4 h-4 w-48" />
          </div>
          <div className="border-border bg-surface flex h-96 flex-col items-center justify-center rounded-3xl border p-6">
            <Skeleton className="h-56 w-56" rounded="full" />
          </div>
        </div>
      </div>
    </div>
  );
}
