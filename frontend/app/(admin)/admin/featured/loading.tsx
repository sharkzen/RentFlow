import { PageHeaderSkeleton, TableSkeleton, CardGridSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeaderSkeleton withSubtitle />
        <Skeleton className="h-10 w-32" rounded="lg" />
      </div>
      <div>
        <Skeleton className="mb-3 h-4 w-40" />
        <CardGridSkeleton
          count={3}
          columns="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
      <div>
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
          <Skeleton className="h-10 w-full md:col-span-3" rounded="lg" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </div>
        <TableSkeleton columns={5} rows={6} />
      </div>
    </div>
  );
}
