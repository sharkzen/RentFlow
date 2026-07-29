import { TableSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" rounded="lg" />
      </div>
      <div className="border-border bg-surface mt-6 mb-6 rounded-xl border p-4">
        <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
      </div>
      <TableSkeleton columns={4} rows={6} />
    </div>
  );
}
