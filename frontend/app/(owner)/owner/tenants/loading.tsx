import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  const gridTemplate =
    "grid-cols-[2fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_1fr_1fr]";

  return (
    <div className="bg-background flex w-full max-w-full flex-col gap-6 py-1">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-[36px] w-48" rounded="md" />
        <Skeleton className="h-[24px] w-64" rounded="md" />
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-3 md:col-span-12 lg:col-span-12 xl:gap-4">
        <div className="relative col-span-6 md:col-span-3 lg:col-span-3">
          <div className="relative h-full">
            <Skeleton className="h-[42px] w-full" rounded="lg" />
          </div>
        </div>

        <div className="relative col-span-6 md:col-span-3 lg:col-span-2">
          <div className="relative h-full">
            <Skeleton className="h-[42px] w-full" rounded="lg" />
          </div>
        </div>

        <div className="relative col-span-12 md:col-span-4 lg:col-span-5">
          <Skeleton className="h-[42px] w-full" rounded="lg" />
        </div>

        <div className="col-span-12 md:col-span-2 lg:col-span-2">
          <Skeleton className="h-[42px] w-full" rounded="lg" />
        </div>
      </div>

      <div className="border-border bg-surface flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border">
        <div
          className={`grid ${gridTemplate} border-border bg-background text-muted shrink-0 items-center gap-4 border-b px-4 py-3 text-xs font-semibold tracking-wider uppercase sm:px-6 sm:py-4`}
        >
          <div>ชื่อ-สกุล</div>
          <div>ห้อง</div>
          <div>สถานะ</div>
          <div className="hidden md:block">เบอร์โทร</div>
          <div className="hidden md:block">อีเมล</div>
          <div className="hidden md:block">เข้าพักเมื่อ</div>
          <div className="text-right">จัดการ</div>
        </div>

        <div className="custom-scrollbar bg-surface flex-1 overflow-hidden">
          <div className="min-w-full">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`grid ${gridTemplate} border-border items-center gap-4 border-b px-4 py-4 last:border-0 sm:px-6`}
              >
                <div className="flex flex-col overflow-hidden">
                  <Skeleton className="h-5 w-3/4 max-w-[140px]" rounded="md" />
                  <div className="mt-1 flex items-center gap-2 md:hidden">
                    <Skeleton className="h-3 w-20" rounded="md" />
                  </div>
                </div>

                <div>
                  <Skeleton className="h-6 w-10" rounded="md" />
                </div>

                <div>
                  <Skeleton className="h-6 w-14" rounded="full" />
                </div>

                <div className="hidden md:block">
                  <Skeleton className="h-4 w-24" rounded="md" />
                </div>

                <div className="hidden md:block">
                  <Skeleton className="h-4 w-32" rounded="md" />
                </div>

                <div className="hidden md:block">
                  <Skeleton className="h-4 w-20" rounded="md" />
                </div>

                <div className="flex justify-end text-right">
                  <Skeleton
                    className="h-[32px] w-[32px] sm:h-[32px] sm:w-[68px]"
                    rounded="lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-muted flex items-center justify-between pt-2 text-sm">
        <Skeleton className="h-5 w-28" rounded="md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20" rounded="md" />
          <Skeleton className="h-5 w-16" rounded="md" />
          <Skeleton className="h-7 w-20" rounded="md" />
        </div>
      </div>
    </div>
  );
}
