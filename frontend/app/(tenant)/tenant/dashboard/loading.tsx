import Skeleton from "@/lib/ui/Skeleton";
import { CardSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen w-full">
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" rounded="full" />
        </div>
      </div>
      <div className="grid grid-cols-1 space-y-5 xl:grid-cols-3 xl:gap-8 xl:space-y-0">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <CardSkeleton lines={4} />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <CardSkeleton lines={3} />
          </div>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-1">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <CardSkeleton lines={2} />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <CardSkeleton lines={3} />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <CardSkeleton lines={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
