import { PageHeaderSkeleton, TableSkeleton } from "@/lib/ui/skeletons";
import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeaderSkeleton withSubtitle />
        <Skeleton className="h-11 w-full md:w-72" rounded="lg" />
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}
