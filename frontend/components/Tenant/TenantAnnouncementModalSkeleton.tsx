"use client";
export function TenantAnnouncementModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-all duration-300">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 w-24 animate-pulse rounded-md bg-slate-200" />
          </div>
          <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="flex-1 p-6">
          <div className="mb-5 h-7 w-3/4 animate-pulse rounded-md bg-slate-200" />

          <div className="mb-5 h-48 w-full animate-pulse rounded-xl bg-slate-100" />

          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-12 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-[42px] w-[42px] animate-pulse rounded-xl bg-slate-200" />
              <div className="h-[42px] w-[42px] animate-pulse rounded-xl bg-slate-200" />
            </div>
            <div className="h-[42px] flex-1 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
