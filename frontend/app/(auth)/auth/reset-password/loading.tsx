import Skeleton from "@/lib/ui/Skeleton";
import { FormFieldGroupSkeleton } from "@/lib/ui/skeletons";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="p-8 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <Skeleton className="mb-6 h-16 w-16" rounded="lg" />
            <Skeleton className="h-8 w-52" />
            <Skeleton className="mt-3 h-4 w-64" />
          </div>
          <FormFieldGroupSkeleton fields={2} withButton />
          <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
