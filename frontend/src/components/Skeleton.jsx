import {cn} from "@/utils/Cn";

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
};
