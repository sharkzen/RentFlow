import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  const gridTemplate =
    "grid-cols-[100px_100px_minmax(150px,1fr)_120px_120px_100px] md:grid-cols-[120px_120px_minmax(200px,2fr)_150px_150px_120px]";

  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Skeleton className="h-[36px] w-52" rounded="md" />
          <Skeleton className="mt-1 h-[20px] w-64" rounded="md" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-4 md:col-span-3">
          <div className="relative h-full">
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
        <div className="col-span-12 sm:col-span-8 md:col-span-4 lg:col-span-5">
          <div className="relative h-full">
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
        <div className="col-span-6 sm:col-span-6 md:col-span-3 lg:col-span-2">
          <div className="relative h-full">
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
        <div className="col-span-6 sm:col-span-6 md:col-span-2 lg:col-span-2">
          <div className="relative h-full">
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
      </div>
      <div className="border-border bg-surface flex h-[65vh] w-full flex-col overflow-hidden rounded-t-xl border">
        <div className="custom-scrollbar h-full w-full overflow-hidden">
          <div className="min-w-[335px]">
            <div
              className={`sticky top-0 z-10 grid ${gridTemplate} border-border bg-background text-muted gap-4 border-b px-6 py-4 text-xs font-semibold tracking-wider uppercase`}
            >
              <div>สถานะ</div>
              <div>ห้อง / พื้นที่</div>
              <div>หัวข้อการแจ้งซ่อม</div>
              <div>ผู้แจ้ง</div>
              <div>วันที่แจ้ง</div>
              <div className="text-right">จัดการ</div>
            </div>
            <div>
              {Array.from({
                length: 6,
              }).map((_, i) => (
                <div
                  key={i}
                  className={`grid ${gridTemplate} border-border items-center gap-4 border-b px-6 py-4 last:border-0`}
                >
                  <div>
                    <Skeleton className="h-6 w-20" rounded="full" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-16" rounded="md" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 pr-4">
                    <Skeleton
                      className="h-5 w-3/4 max-w-[200px]"
                      rounded="md"
                    />
                    <Skeleton
                      className="h-3 w-1/2 max-w-[150px]"
                      rounded="md"
                    />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-24" rounded="md" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28" rounded="md" />
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Skeleton className="h-[32px] w-[32px]" rounded="full" />
                    <Skeleton className="h-[32px] w-[32px]" rounded="full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-border flex items-center justify-between border-t pt-4">
        <div className="hidden sm:block">
          <Skeleton className="h-5 w-64" rounded="md" />
        </div>
        <div className="sm:hidden">
          <Skeleton className="h-5 w-32" rounded="md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-[36px] w-[88px]" rounded="lg" />
          <div className="hidden items-center gap-1 sm:flex">
            <Skeleton className="h-[36px] w-[36px]" rounded="lg" />
            <span className="text-muted">/</span>
            <Skeleton className="mx-2 h-5 w-5" rounded="md" />
          </div>
          <Skeleton className="h-[36px] w-[76px]" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
