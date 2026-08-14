import { TableSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="border-border bg-surface rounded-xl border p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 w-full sm:w-64" rounded="lg" />
          <Skeleton className="h-10 w-full sm:w-40" rounded="lg" />
        </div>
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}
