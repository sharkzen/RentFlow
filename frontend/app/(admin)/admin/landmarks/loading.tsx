import { TableSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" rounded="lg" />
      </div>
      <div className="mt-6 mb-6 rounded-xl border border-gray-100 bg-white p-4">
        <Skeleton className="h-10 w-full max-w-md" rounded="lg" />
      </div>
      <TableSkeleton columns={4} rows={6} />
    </div>
  );
}
