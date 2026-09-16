import { qx } from "@/lib/quack-elements"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="skeleton"
      className={qx("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
