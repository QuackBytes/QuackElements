import { qx } from "@/lib/quack-elements"

function AspectRatio({
  ratio,
  className,
  ...props
}: React.ComponentProps<"div"> & { ratio: number }) {
  return (
    <div
      data-qe-slot="aspect-ratio"
      style={
        {
          "--ratio": ratio,
        } as React.CSSProperties
      }
      className={qx("relative aspect-(--ratio)", className)}
      {...props}
    />
  )
}

export { AspectRatio }
