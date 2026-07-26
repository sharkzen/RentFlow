import Skeleton from "@/lib/ui/Skeleton";
import { CardSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12" rounded="full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-11 w-40" rounded="lg" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Skeleton className="h-10 w-full sm:w-48" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
    </div>
  );
}
