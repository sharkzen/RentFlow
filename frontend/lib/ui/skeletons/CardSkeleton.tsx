import Skeleton from "@/lib/ui/Skeleton";

type CardSkeletonProps = {
  withImage?: boolean;
  lines?: number;
};

export function CardSkeleton({
  withImage = false,
  lines = 2,
}: CardSkeletonProps) {
  return (
    <div className="border-border bg-surface space-y-3 rounded-2xl border p-4">
      {withImage && <Skeleton className="h-36 w-full" rounded="lg" />}
      <Skeleton className="h-4 w-3/4" />
      {Array.from({
        length: lines,
      }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

type CardGridSkeletonProps = {
  count?: number;
  columns?: string;
  withImage?: boolean;
};

export function CardGridSkeleton({
  count = 6,
  columns = "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  withImage = false,
}: CardGridSkeletonProps) {
  return (
    <div className={`grid ${columns}`}>
      {Array.from({
        length: count,
      }).map((_, i) => (
        <CardSkeleton key={i} withImage={withImage} />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="border-border bg-surface flex items-center gap-4 rounded-xl border p-4">
      <Skeleton className="h-10 w-10" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({
        length: count,
      }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
