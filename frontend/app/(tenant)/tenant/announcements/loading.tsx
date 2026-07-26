import Skeleton from "@/lib/ui/Skeleton";
import { ListSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <ListSkeleton count={4} />
      </div>
    </div>
  );
}
