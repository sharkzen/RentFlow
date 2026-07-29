import Skeleton from "@/lib/ui/Skeleton";
import { FormFieldGroupSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="bg-background grid h-[calc(100vh-65px)] w-full md:grid-cols-2">
      <div className="bg-surface hidden md:block" />
      <div className="flex items-center justify-center px-6 py-12 md:px-12 lg:px-24">
        <div className="w-full max-w-2xl">
          <div className="mb-5 flex flex-col items-center">
            <Skeleton className="mb-4 h-10 w-44" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="mt-4 h-4 w-72" />
          </div>
          <div className="border-border bg-surface rounded-2xl border p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormFieldGroupSkeleton fields={4} withButton={false} />
              <FormFieldGroupSkeleton fields={4} withButton={false} />
            </div>
            <Skeleton className="mt-6 h-11 w-full" rounded="lg" />
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
