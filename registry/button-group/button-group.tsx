import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { qx } from "@/lib/quack-elements"

import { Separator } from "@/components/quack/separator"

const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-qe-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-qe-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-qe-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "*:data-qe-slot:rounded-r-none [&>[data-qe-slot]:not(:has(~[data-qe-slot]))]:rounded-r-md! [&>[data-qe-slot]~[data-qe-slot]]:rounded-l-none [&>[data-qe-slot]~[data-qe-slot]]:border-l-0",
        vertical:
          "flex-col *:data-qe-slot:rounded-b-none [&>[data-qe-slot]:not(:has(~[data-qe-slot]))]:rounded-b-md! [&>[data-qe-slot]~[data-qe-slot]]:rounded-t-none [&>[data-qe-slot]~[data-qe-slot]]:border-t-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-qe-slot="button-group"
      data-orientation={orientation}
      className={qx(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: qx(
          "flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "button-group-text",
    },
  })
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-qe-slot="button-group-separator"
      orientation={orientation}
      className={qx(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}
