import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  const gridTemplate =
    "grid-cols-[40px_1.5fr_1fr_1fr_1fr_120px] md:grid-cols-[60px_2fr_1.5fr_1fr_1fr_150px]";

  return (
    <div className="relative flex h-[calc(100dvh-2rem)] w-full flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-9 w-44" rounded="md" />
          <Skeleton className="mt-1 h-5 w-64" rounded="md" />
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:justify-between sm:gap-3">
          <div className="relative w-full md:w-auto">
            <Skeleton className="h-[42px] w-full min-w-[200px]" rounded="lg" />
          </div>
          <Skeleton className="h-[42px] w-[140px]" rounded="lg" />
          <Skeleton className="h-[42px] w-[110px]" rounded="lg" />
        </div>
      </div>
      <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Skeleton className="h-10 w-full" rounded="lg" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-[140px]" rounded="lg" />
          </div>
          <div className="bg-border hidden h-8 w-px lg:block" />
          <div className="relative w-full sm:w-48">
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
      </div>
      <div className="flex h-[65vh] w-full flex-col">
        <div className="w-full flex-1 overflow-hidden">
          <div className="border-border bg-surface flex h-full max-h-[calc(100vh-200px)] w-full flex-col overflow-hidden rounded-t-xl border shadow-sm">
            <div
              className={`grid ${gridTemplate} border-border bg-background text-muted gap-4 border-b px-6 py-4 text-xs font-medium uppercase`}
            >
              <div className="flex items-center justify-center">
                <Skeleton className="h-4 w-4" rounded="sm" />
              </div>
              <div className="font-semibold tracking-wider">ห้อง / ผู้เช่า</div>
              <div className="font-semibold tracking-wider">ประจำเดือน</div>
              <div className="text-right font-semibold tracking-wider">
                ยอดรวม
              </div>
              <div className="text-center font-semibold tracking-wider">
                สถานะ
              </div>
              <div className="text-right font-semibold tracking-wider">
                จัดการ
              </div>
            </div>
            <div className="custom-scrollbar bg-surface flex-1 overflow-hidden">
              <div className="min-w-[335px] text-nowrap">
                {Array.from({
                  length: 6,
                }).map((_, i) => (
                  <div
                    key={i}
                    className={`grid ${gridTemplate} border-border items-center gap-4 border-b px-6 py-4 last:border-0`}
                  >
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-4 w-4" rounded="sm" />
                    </div>
                    <div className="flex flex-col truncate">
                      <Skeleton className="mb-1 h-5 w-16" rounded="md" />
                      <Skeleton className="h-3 w-28" rounded="md" />
                    </div>
                    <div className="text-muted text-sm">
                      <Skeleton className="h-4 w-24" rounded="md" />
                    </div>
                    <div className="flex justify-end text-right text-sm">
                      <Skeleton className="h-5 w-20" rounded="md" />
                    </div>
                    <div className="flex justify-center">
                      <Skeleton className="h-6 w-20" rounded="full" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-[32px] w-[64px]" rounded="lg" />
                      <Skeleton className="h-[32px] w-[32px]" rounded="lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-border bg-surface flex items-center justify-between border-t p-2">
          <div className="text-muted text-xs">
            <Skeleton className="h-4 w-40" rounded="md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[32px] w-[32px]" rounded="lg" />
            <Skeleton className="mx-1 h-5 w-16" rounded="md" />
            <Skeleton className="h-[32px] w-[32px]" rounded="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
