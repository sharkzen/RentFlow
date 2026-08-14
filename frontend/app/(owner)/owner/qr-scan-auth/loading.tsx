import Skeleton from "@/lib/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full flex-1">
      <div className="mx-auto max-w-400 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-9 w-64" rounded="md" />
          <Skeleton className="h-5 w-96" rounded="md" />
        </div>
        <div className="border-border my-5 w-full rounded-xl border">
          <div className="border-border bg-background/30 grid w-full min-w-0 grid-cols-1 items-center gap-3 rounded-t-xl border-b p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:gap-4">
            <Skeleton className="h-11 w-full" rounded="lg" />
            <Skeleton className="h-11 w-full" rounded="lg" />
            <Skeleton
              className="h-11 w-full sm:col-span-2 lg:col-span-1"
              rounded="lg"
            />
            <Skeleton className="h-11 w-full lg:w-44" rounded="lg" />
          </div>
          <div className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50/60 px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-4 shrink-0" rounded="full" />
            <Skeleton className="h-4 w-72" rounded="md" />
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-border bg-background/50 text-muted border-b">
                  <th className="w-12 px-4 py-4 text-center sm:px-6">
                    <Skeleton className="mx-auto h-4 w-4" rounded="sm" />
                  </th>
                  <th className="px-4 py-4 sm:px-6">
                    <Skeleton className="h-4 w-12" rounded="md" />
                  </th>
                  <th className="px-4 py-4 sm:px-6">
                    <Skeleton className="h-4 w-28" rounded="md" />
                  </th>
                  <th className="px-4 py-4 sm:px-6">
                    <Skeleton className="h-4 w-20" rounded="md" />
                  </th>
                  <th className="px-4 py-4 sm:px-6">
                    <Skeleton className="h-4 w-32" rounded="md" />
                  </th>
                  <th className="px-4 py-4 text-right sm:px-6">
                    <Skeleton className="ml-auto h-4 w-16" rounded="md" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {Array.from({
                  length: 6,
                }).map((_, i) => (
                  <tr key={i} className="transition-colors">
                    <td className="px-4 py-4 text-center sm:px-6">
                      <Skeleton className="mx-auto h-4 w-4" rounded="sm" />
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <Skeleton className="h-6 w-14" rounded="md" />
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-9" rounded="full" />
                        <Skeleton className="h-4 w-20" rounded="md" />
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <Skeleton className="h-6 w-16" rounded="md" />
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <Skeleton className="h-4 w-36" rounded="md" />
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-28" rounded="md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
