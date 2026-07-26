import Skeleton from "@/lib/ui/Skeleton";
import { CardGridSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex w-full flex-col justify-between gap-3 sm:flex-row sm:items-center lg:w-auto">
          <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
          <Skeleton className="h-10 w-40" rounded="lg" />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-32" rounded="lg" />
      </div>
      <CardGridSkeleton count={9} columns="grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}
