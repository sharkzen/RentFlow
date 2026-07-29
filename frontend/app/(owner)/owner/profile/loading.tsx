import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <Skeleton className="h-[36px] w-48" rounded="md" />
        <Skeleton className="mt-1 h-5 w-72" rounded="md" />
      </div>
      <div className="border-border bg-surface relative h-full w-full overflow-hidden rounded-xl border">
        <div className="border-border bg-surface flex items-center justify-between border-b p-4">
          <div>
            <Skeleton className="h-6 w-28" rounded="md" />
            <Skeleton className="mt-1 h-4 w-64" rounded="md" />
          </div>
          <Skeleton className="h-[36px] w-[88px]" rounded="lg" />
        </div>
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
            <div className="group">
              <Skeleton className="mb-1.5 h-4 w-24" rounded="md" />
              <div className="relative">
                <Skeleton className="h-[42px] w-full" rounded="lg" />
              </div>
            </div>
            <div className="group">
              <Skeleton className="mb-1.5 h-4 w-24" rounded="md" />
              <div className="relative">
                <Skeleton className="h-[42px] w-full" rounded="lg" />
              </div>
            </div>
            <div className="group">
              <Skeleton className="mb-1.5 h-4 w-16" rounded="md" />
              <div className="relative">
                <Skeleton className="h-[42px] w-full" rounded="lg" />
              </div>
            </div>
            <div className="group">
              <div className="mb-1.5 flex justify-between">
                <Skeleton className="h-4 w-28" rounded="md" />
              </div>
              <div className="relative">
                <Skeleton className="h-[42px] w-full" rounded="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
