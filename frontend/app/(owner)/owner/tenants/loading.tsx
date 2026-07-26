import Skeleton from "@/lib/ui/Skeleton";
import { TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex w-full max-w-full flex-col gap-6 bg-white py-1">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-12 gap-3 xl:gap-4">
        <Skeleton className="col-span-6 h-10 md:col-span-3" rounded="lg" />
        <Skeleton className="col-span-6 h-10 md:col-span-3 lg:col-span-2" rounded="lg" />
        <Skeleton className="col-span-12 h-10 md:col-span-4 lg:col-span-5" rounded="lg" />
        <Skeleton className="col-span-12 h-10 md:col-span-2" rounded="lg" />
      </div>
      <TableSkeleton columns={6} rows={8} />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" rounded="md" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20" rounded="md" />
        </div>
      </div>
    </div>
  );
}
