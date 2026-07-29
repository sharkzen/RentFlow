import Skeleton from "@/lib/ui/Skeleton";
import { CardSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0" rounded="full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" rounded="md" />
            <Skeleton className="h-4 w-64" rounded="md" />
          </div>
        </div>
        <Skeleton className="h-10 w-full sm:w-36" rounded="lg" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Skeleton className="h-10 w-full sm:w-52" rounded="lg" />
        <Skeleton className="h-10 w-full sm:w-44" rounded="lg" />
      </div>

      <div className="space-y-4">
        {Array.from({
          length: 3,
        }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" rounded="full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32" rounded="md" />
                  <Skeleton className="h-3.5 w-24" rounded="md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" rounded="full" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-5 w-3/4" rounded="md" />
              <Skeleton className="h-4 w-full" rounded="md" />
              <Skeleton className="h-4 w-5/6" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
