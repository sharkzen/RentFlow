import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="mb-8 flex flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-24" rounded="full" />
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
          <Skeleton className="h-11 w-full sm:w-32" rounded="lg" />
          <Skeleton className="h-11 w-full sm:w-32" rounded="lg" />
          <Skeleton className="h-11 w-full sm:w-32" rounded="lg" />
        </div>
      </div>
      <div className="w-full px-4">
        <div className="border-border bg-surface mx-auto max-w-3xl space-y-6 rounded-2xl border p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-12" rounded="lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-border space-y-2 border-t pt-4">
            {Array.from({
              length: 5,
            }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="border-border flex justify-between border-t pt-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
