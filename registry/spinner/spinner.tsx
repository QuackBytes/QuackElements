import { qx } from "@/lib/quack-elements"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-qe-slot="spinner" role="status" aria-label="Loading" className={qx("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
