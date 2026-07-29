import { PageHeaderSkeleton, TableSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeaderSkeleton withSubtitle />
          <Skeleton className="h-11 w-full sm:w-40" rounded="lg" />
        </div>
        <div className="border-border bg-surface overflow-hidden rounded-2xl border">
          <div className="border-border border-b p-4 sm:p-5">
            <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
          </div>
          <TableSkeleton columns={5} rows={6} />
        </div>
      </div>
    </div>
  );
}
