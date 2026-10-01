import Skeleton from "@/lib/ui/Skeleton";
import { CardSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <CardSkeleton lines={4} />
      <CardSkeleton lines={3} />
    </div>
  );
}
