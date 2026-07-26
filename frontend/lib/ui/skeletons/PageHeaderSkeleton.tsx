import Skeleton from "@/lib/ui/Skeleton";

type PageHeaderSkeletonProps = {
  withSubtitle?: boolean;
  withAction?: boolean;
};

export function PageHeaderSkeleton({
  withSubtitle = true,
  withAction = false,
}: PageHeaderSkeletonProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        {withSubtitle && <Skeleton className="h-4 w-72" />}
      </div>
      {withAction && <Skeleton className="h-10 w-32" rounded="lg" />}
    </div>
  );
}
