import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container">
      <div className="border-border mb-8 flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44" rounded="md" />
          <Skeleton className="h-4 w-72" rounded="md" />
        </div>
        <div className="flex max-sm:w-full max-sm:justify-end">
          <Skeleton className="h-10 w-full sm:w-36" rounded="lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({
          length: 8,
        }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-surface flex flex-col space-y-4 overflow-hidden rounded-2xl border p-4 shadow-sm"
          >
            <Skeleton className="h-44 w-full" rounded="lg" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" rounded="md" />
              <Skeleton className="h-4 w-1/2" rounded="md" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-20" rounded="full" />
              <Skeleton className="h-8 w-8" rounded="full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
