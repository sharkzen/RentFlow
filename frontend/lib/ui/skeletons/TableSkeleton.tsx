import Skeleton from "@/lib/ui/Skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function TableSkeleton({ columns = 4, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex gap-4 border-b border-gray-100 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-50 p-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
