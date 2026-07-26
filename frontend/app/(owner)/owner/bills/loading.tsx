import Skeleton from "@/lib/ui/Skeleton";
import { TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="relative flex h-[calc(100dvh-2rem)] w-full flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:justify-between sm:gap-3">
          <Skeleton className="h-10 w-40" rounded="lg" />
          <Skeleton className="h-10 w-36" rounded="lg" />
          <Skeleton className="h-10 w-28" rounded="lg" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-48" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-48" rounded="lg" />
      </div>
      <div className="flex h-[65vh] w-full flex-col">
        <div className="w-full flex-1 overflow-hidden">
          <TableSkeleton columns={6} rows={8} />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 bg-white p-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" rounded="lg" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8" rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
