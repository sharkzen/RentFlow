import Skeleton from "@/lib/ui/Skeleton";
import { CardGridSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">
        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 py-12 text-center">
          <Skeleton className="mb-6 h-16 w-64 bg-slate-800" />
          <Skeleton className="mb-8 h-8 w-80 bg-slate-800" />
          <Skeleton className="mb-10 h-4 w-96 bg-slate-800" />
          <Skeleton className="h-14 w-full max-w-md bg-slate-800" rounded="lg" />
        </div>
      </section>
      <div className="min-h-screen w-full bg-[#F3F4F6] pb-24">
        <div className="mx-auto sm:px-4">
          <div className="py-6">
            <Skeleton className="h-14 w-full" rounded="lg" />
          </div>
          <div className="py-4">
            <div className="mb-8 flex items-center justify-between">
              <Skeleton className="h-8 w-48" rounded="full" />
              <Skeleton className="h-4 w-24" rounded="full" />
            </div>
            <CardGridSkeleton
              count={8}
              withImage
              columns="grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
