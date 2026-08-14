import Skeleton from "@/lib/ui/Skeleton";
import { TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10 md:space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-full lg:w-48" rounded="lg" />
      </div>
      <div className="border-border bg-surface flex items-center justify-between rounded-3xl border p-6 md:p-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-14 w-14 md:h-20 md:w-20" rounded="full" />
      </div>
      <TableSkeleton columns={4} rows={6} />
    </div>
  );
}
