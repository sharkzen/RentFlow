import Skeleton from "@/lib/ui/Skeleton";
import { CardGridSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="container">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-full sm:w-40" rounded="lg" />
      </div>
      <CardGridSkeleton
        count={8}
        columns="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        withImage
      />
    </div>
  );
}
