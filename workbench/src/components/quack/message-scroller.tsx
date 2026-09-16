import * as React from "react"
import { ArrowDownIcon } from "lucide-react"

import { qx } from "@/lib/quack-elements"
import { Button } from "@/components/quack/button"

type ScrollDirection = "start" | "end"

interface MessageScrollerContextValue {
  viewportRef: React.RefObject<HTMLDivElement | null>
  atStart: boolean
  atEnd: boolean
  measure: () => void
  scrollTo: (direction: ScrollDirection) => void
}

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null)

function MessageScrollerProvider({ children }: React.PropsWithChildren) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ atStart: true, atEnd: true })

  const measure = React.useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const threshold = 2
    setPosition({
      atStart: viewport.scrollTop <= threshold,
      atEnd: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= threshold,
    })
  }, [])

  const scrollTo = React.useCallback((direction: ScrollDirection) => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: direction === "start" ? 0 : viewport.scrollHeight,
      behavior: "smooth",
    })
  }, [])

  const value = React.useMemo(
    () => ({ viewportRef, atStart: position.atStart, atEnd: position.atEnd, measure, scrollTo }),
    [measure, position.atEnd, position.atStart, scrollTo]
  )

  return <MessageScrollerContext.Provider value={value}>{children}</MessageScrollerContext.Provider>
}

function useMessageScroller() {
  const context = React.useContext(MessageScrollerContext)
  if (!context) {
    throw new Error("MessageScroller components must be wrapped in MessageScrollerProvider")
  }
  return context
}

function useMessageScrollerScrollable() {
  const { atStart, atEnd } = useMessageScroller()
  return !atStart || !atEnd
}

function useMessageScrollerVisibility(direction: ScrollDirection = "end") {
  const { atStart, atEnd } = useMessageScroller()
  return direction === "start" ? !atStart : !atEnd
}

function MessageScroller({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="message-scroller"
      className={qx(
        "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function MessageScrollerViewport({ className, onScroll, ...props }: React.ComponentProps<"div">) {
  const { viewportRef, measure } = useMessageScroller()

  React.useEffect(() => {
    measure()
  }, [measure])

  return (
    <div
      ref={viewportRef}
      data-qe-slot="message-scroller-viewport"
      className={qx(
        "size-full min-h-0 min-w-0 scroll-fade-b overflow-y-auto overscroll-contain",
        className
      )}
      onScroll={(event) => {
        measure()
        onScroll?.(event)
      }}
      {...props}
    />
  )
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="message-scroller-content"
      className={qx("flex min-h-full flex-col gap-8", className)}
      {...props}
    />
  )
}

function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<"div"> & { scrollAnchor?: boolean }) {
  return (
    <div
      data-qe-slot="message-scroller-item"
      data-scroll-anchor={scrollAnchor || undefined}
      className={qx("min-w-0 shrink-0", className)}
      {...props}
    />
  )
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  variant = "secondary",
  size = "icon-sm",
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { direction?: ScrollDirection }) {
  const { scrollTo } = useMessageScroller()
  const visible = useMessageScrollerVisibility(direction)

  return (
    <Button
      data-qe-slot="message-scroller-button"
      data-direction={direction}
      data-active={visible}
      variant={variant}
      size={size}
      className={qx(
        "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background transition-all",
        "data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0",
        "data-[direction=end]:bottom-4 data-[direction=start]:top-4",
        className
      )}
      onClick={(event) => {
        scrollTo(direction)
        onClick?.(event)
      }}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDownIcon className={direction === "start" ? "rotate-180" : undefined} />
          <span className="sr-only">
            {direction === "end" ? "Scroll to end" : "Scroll to start"}
          </span>
        </>
      )}
    </Button>
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
