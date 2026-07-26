import Skeleton from "@/lib/ui/Skeleton";
import { FormFieldGroupSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-8" rounded="lg" />
        </div>
        <div className="p-4">
          <FormFieldGroupSkeleton fields={4} withButton={false} />
        </div>
      </div>
    </div>
  );
}
