"use client";
export function TenantAnnouncementModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-all duration-300">
      <div className="bg-surface flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="border-border bg-background flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-border h-5 w-5 animate-pulse rounded-full" />
            <div className="bg-border h-5 w-24 animate-pulse rounded-md" />
          </div>
          <div className="bg-border h-5 w-5 animate-pulse rounded-full" />
        </div>
        <div className="flex-1 p-6">
          <div className="bg-border mb-5 h-7 w-3/4 animate-pulse rounded-md" />
          <div className="bg-background mb-5 h-48 w-full animate-pulse rounded-xl" />
          <div className="space-y-3">
            <div className="bg-background h-4 w-full animate-pulse rounded" />
            <div className="bg-background h-4 w-full animate-pulse rounded" />
            <div className="bg-background h-4 w-5/6 animate-pulse rounded" />
            <div className="bg-background h-4 w-4/6 animate-pulse rounded" />
          </div>
        </div>
        <div className="border-border bg-background/50 flex flex-col gap-4 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="bg-border h-4 w-40 animate-pulse rounded" />
            <div className="bg-border h-6 w-12 animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="bg-border h-[42px] w-[42px] animate-pulse rounded-xl" />
              <div className="bg-border h-[42px] w-[42px] animate-pulse rounded-xl" />
            </div>
            <div className="bg-border h-[42px] flex-1 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
