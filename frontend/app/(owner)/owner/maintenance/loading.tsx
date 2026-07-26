import Skeleton from "@/lib/ui/Skeleton";
import { TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full lg:w-56" rounded="lg" />
        <Skeleton className="h-10 w-full lg:w-64" rounded="lg" />
        <Skeleton className="h-10 w-full lg:w-40" rounded="lg" />
        <Skeleton className="h-10 w-full lg:w-64" rounded="lg" />
      </div>
      <TableSkeleton columns={5} rows={8} />
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Skeleton className="h-4 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" rounded="lg" />
          <Skeleton className="h-9 w-16" rounded="lg" />
          <Skeleton className="h-9 w-24" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
