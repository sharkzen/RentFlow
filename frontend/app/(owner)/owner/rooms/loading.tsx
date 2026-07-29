import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-24" rounded="md" />
          <Skeleton className="h-5 w-52" rounded="md" />
        </div>
        <div className="flex w-full flex-col justify-between gap-3 sm:flex-row sm:items-center lg:w-auto">
          <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
          <Skeleton className="h-10 w-full shrink-0 sm:w-36" rounded="lg" />
        </div>
      </div>

      <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1" rounded="lg" />
        <div className="bg-border hidden h-8 w-px sm:block"></div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap">
          <Skeleton className="h-10 w-full sm:w-28" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-36" rounded="lg" />
          <Skeleton
            className="col-span-2 h-10 w-full sm:col-span-1 sm:w-36"
            rounded="lg"
          />
        </div>
      </div>

      <div className="border-border bg-surface flex h-[65vh] w-full flex-col overflow-hidden rounded-xl border">
        <div className="border-border bg-background border-b px-6 py-4">
          <div className="grid grid-cols-7 gap-4">
            <Skeleton className="h-4 w-10" rounded="md" />
            <Skeleton className="h-4 w-20" rounded="md" />
            <Skeleton className="h-4 w-14" rounded="md" />
            <Skeleton className="h-4 w-14" rounded="md" />
            <Skeleton className="h-4 w-16" rounded="md" />
            <Skeleton className="h-4 w-20" rounded="md" />
            <Skeleton className="ml-auto h-4 w-12" rounded="md" />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-hidden p-6">
          {Array.from({
            length: 6,
          }).map((_, i) => (
            <div
              key={i}
              className="border-border/40 grid grid-cols-7 items-center gap-4 border-b py-2 last:border-0"
            >
              <Skeleton className="h-4 w-12" rounded="md" />
              <Skeleton className="h-5 w-16" rounded="md" />
              <Skeleton className="h-4 w-24" rounded="md" />
              <Skeleton className="h-6 w-20" rounded="full" />
              <Skeleton className="h-6 w-16" rounded="full" />
              <Skeleton className="h-5 w-16" rounded="md" />
              <Skeleton className="ml-auto h-8 w-8" rounded="lg" />
            </div>
          ))}
        </div>

        <div className="border-border bg-surface mt-auto border-t px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-48" rounded="md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" rounded="lg" />
              <Skeleton className="h-4 w-20" rounded="md" />
              <Skeleton className="h-8 w-16" rounded="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
