import Skeleton from "@/lib/ui/Skeleton";
import { FormFieldGroupSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="bg-background grid h-[calc(100vh-65px)] w-full md:grid-cols-2">
      <div className="bg-surface hidden md:block" />
      <div className="flex items-center justify-center px-6 py-12 md:px-12 lg:px-24">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <Skeleton className="mb-10 h-10 w-40" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="border-border bg-surface rounded-2xl border p-6 shadow-sm">
            <FormFieldGroupSkeleton fields={2} withButton />
            <div className="mt-2 flex justify-between pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
