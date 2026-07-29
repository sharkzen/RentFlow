import Skeleton from "@/lib/ui/Skeleton";
import { FormFieldGroupSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-border bg-surface w-full max-w-110 space-y-8 rounded-2xl border p-10">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-6 h-14 w-14" rounded="lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-64" />
          <Skeleton className="mt-1.5 h-4 w-52" />
        </div>
        <div className="mt-8">
          <FormFieldGroupSkeleton fields={1} withButton />
        </div>
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}
