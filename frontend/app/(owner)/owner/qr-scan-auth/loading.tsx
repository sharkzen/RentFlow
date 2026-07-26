import Skeleton from "@/lib/ui/Skeleton";
import { TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="w-full flex-1">
      <div className="mx-auto max-w-[1600px]">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full sm:w-56" rounded="lg" />
            <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
            <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" rounded="lg" />
            <Skeleton className="h-10 w-10" rounded="lg" />
          </div>
        </div>
        <div className="mt-6">
          <TableSkeleton columns={6} rows={8} />
        </div>
      </div>
    </div>
  );
}
