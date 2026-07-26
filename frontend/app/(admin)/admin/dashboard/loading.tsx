import {
  PageHeaderSkeleton,
  StatCardGridSkeleton,
  TableSkeleton,
  CardSkeleton,
} from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-8 pb-10">
      <PageHeaderSkeleton withSubtitle />
      <StatCardGridSkeleton
        count={1}
        columns="grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-1"
      />
      <StatCardGridSkeleton
        count={6}
        columns="grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton columns={4} rows={5} />
        </div>
        <div className="h-full">
          <CardSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
