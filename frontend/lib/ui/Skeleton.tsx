import clsx from "clsx";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
};

export default function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "bg-skeleton animate-pulse",
        {
          sm: "rounded-sm",
          md: "rounded-md",
          lg: "rounded-lg",
          full: "rounded-full",
        }[rounded],
        className,
      )}
    />
  );
}
