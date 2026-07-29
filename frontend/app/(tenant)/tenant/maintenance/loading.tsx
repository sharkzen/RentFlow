import Skeleton from "@/lib/ui/Skeleton";
import { ListSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="bg-background mb-8 flex w-full gap-2 rounded-2xl p-1.5">
        <Skeleton className="h-11 flex-1" rounded="lg" />
        <Skeleton className="h-11 flex-1" rounded="lg" />
      </div>
      <ListSkeleton count={5} />
    </div>
  );
}
