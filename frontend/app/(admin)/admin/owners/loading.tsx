import { PageHeaderSkeleton, TableSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeaderSkeleton withSubtitle />
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}
