import Skeleton from "@/lib/ui/Skeleton";
import { CardSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-5 w-5" rounded="full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
      <div className="space-y-5">
        <CardSkeleton lines={3} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <CardSkeleton lines={5} />
          </div>
          <div className="space-y-5">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
