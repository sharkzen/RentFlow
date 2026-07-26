import Skeleton from "@/lib/ui/Skeleton";

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full" rounded="lg" />
    </div>
  );
}

type FormFieldGroupSkeletonProps = {
  fields?: number;
  withButton?: boolean;
};

export function FormFieldGroupSkeleton({
  fields = 4,
  withButton = true,
}: FormFieldGroupSkeletonProps) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      {withButton && <Skeleton className="h-11 w-full" rounded="lg" />}
    </div>
  );
}
