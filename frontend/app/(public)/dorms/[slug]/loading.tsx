import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20 sm:p-4">
      <section className="w-full overflow-hidden">
        <Skeleton className="h-105 w-full rounded-none md:h-130" />
      </section>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-8">
            <div className="space-y-4 bg-white p-6 sm:rounded-2xl sm:p-8">
              <Skeleton className="h-8 w-2/3" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              <Skeleton className="mt-6 h-72 w-full" rounded="lg" />
            </div>
            <div className="space-y-4 bg-white p-6 sm:rounded-2xl sm:p-8">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-56 w-full" rounded="lg" />
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-4">
            <div className="sticky top-24 z-10 space-y-4 rounded-2xl border border-gray-100 bg-white p-6">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-11 w-full" rounded="lg" />
              <Skeleton className="h-11 w-full" rounded="lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
