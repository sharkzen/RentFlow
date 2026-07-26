import Skeleton from "@/lib/ui/Skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12" rounded="lg" />
      </div>
    </div>
  );
}

type StatCardGridSkeletonProps = {
  count?: number;
  columns?: string;
};

export function StatCardGridSkeleton({
  count = 4,
  columns = "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4",
}: StatCardGridSkeletonProps) {
  return (
    <div className={`grid ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
