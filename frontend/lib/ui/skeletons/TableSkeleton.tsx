import Skeleton from "@/lib/ui/Skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function TableSkeleton({ columns = 4, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border">
      <div className="border-border flex gap-4 border-b p-4">
        {Array.from({
          length: columns,
        }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({
        length: rows,
      }).map((_, r) => (
        <div
          key={r}
          className="border-border flex gap-4 border-b p-4 last:border-0"
        >
          {Array.from({
            length: columns,
          }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
