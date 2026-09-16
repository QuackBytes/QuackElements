import * as React from "react"
import { CheckIcon } from "lucide-react"

import { qx } from "@/lib/quack-elements"
import { Button } from "@/components/quack/button"

function Questionnaire({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="questionnaire"
      className={qx("flex w-full min-w-0 flex-col gap-6", className)}
      {...props}
    />
  )
}

function QuestionnaireProgress({
  className,
  current,
  total,
  children,
  ...props
}: React.ComponentProps<"div"> & { current?: number; total?: number }) {
  const label = children ?? (current !== undefined && total !== undefined ? `${current} / ${total}` : null)

  return (
    <div
      data-qe-slot="questionnaire-progress"
      className={qx(
        "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    >
      {label}
    </div>
  )
}

function QuestionnaireItem({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-qe-slot="questionnaire-item"
      className={qx("flex min-w-0 flex-col gap-5 border-0 p-0 outline-none", className)}
      {...props}
    />
  )
}

function QuestionnaireTitle({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-qe-slot="questionnaire-title"
      className={qx("font-heading text-base font-semibold text-pretty", className)}
      {...props}
    />
  )
}

function QuestionnaireDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-qe-slot="questionnaire-description"
      className={qx("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireChoices({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="questionnaire-choices"
      className={qx("grid min-w-0 gap-3", className)}
      {...props}
    />
  )
}

interface QuestionnaireChoiceProps extends Omit<React.ComponentProps<"label">, "onChange"> {
  type?: "checkbox" | "radio"
  name?: string
  value?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function QuestionnaireChoice({
  children,
  className,
  type = "radio",
  checked,
  defaultChecked = false,
  disabled = false,
  name,
  value,
  onCheckedChange,
  ...props
}: QuestionnaireChoiceProps) {
  const controlled = checked !== undefined
  const [localChecked, setLocalChecked] = React.useState(defaultChecked)
  const selected = controlled ? checked : localChecked

  return (
    <label
      data-qe-slot="questionnaire-choice"
      data-type={type}
      data-checked={selected || undefined}
      data-disabled={disabled || undefined}
      className={qx(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input bg-transparent px-4 py-3.5 text-start text-sm shadow-xs transition-colors outline-none select-none hover:bg-muted/50",
        "has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-checked:border-primary/40 data-checked:bg-muted",
        className
      )}
      {...props}
    >
      <input
        data-qe-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        type={type}
        name={name}
        value={value}
        checked={controlled ? checked : undefined}
        defaultChecked={controlled ? undefined : defaultChecked}
        disabled={disabled}
        onChange={(event) => {
          if (!controlled) setLocalChecked(event.currentTarget.checked)
          onCheckedChange?.(event.currentTarget.checked)
        }}
      />
      <span
        aria-hidden="true"
        data-qe-slot="questionnaire-choice-indicator"
        className={qx(
          "pointer-events-none relative flex size-4 shrink-0 items-center justify-center border border-input",
          type === "radio" ? "rounded-full" : "rounded-[4px]",
          selected && "border-primary bg-primary text-primary-foreground"
        )}
      >
        {selected && type === "radio" ? <span className="size-2 rounded-full bg-current" /> : null}
        {selected && type === "checkbox" ? <CheckIcon className="size-3.5" /> : null}
      </span>
      <span data-qe-slot="questionnaire-choice-label" className="flex min-w-0 flex-1 flex-col gap-1 leading-snug">
        {children}
      </span>
    </label>
  )
}

function QuestionnaireChoiceDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-qe-slot="questionnaire-choice-description"
      className={qx("text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-qe-slot="questionnaire-input"
      className={qx(
        "min-h-11 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-qe-slot="questionnaire-error" className={qx("text-sm text-destructive", className)} {...props} />
  )
}

function QuestionnaireActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-qe-slot="questionnaire-actions"
      className={qx(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function QuestionnairePrevious({ children = "Previous", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-qe-slot="questionnaire-previous" type="button" variant="outline" {...props}>{children}</Button>
}

function QuestionnaireSkip({ children = "Skip", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-qe-slot="questionnaire-skip" type="button" variant="outline" {...props}>{children}</Button>
}

function QuestionnaireNext({ children = "Next", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-qe-slot="questionnaire-next" type="button" {...props}>{children}</Button>
}

function QuestionnaireSubmit({ children = "Submit", ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-qe-slot="questionnaire-submit" type="submit" {...props}>{children}</Button>
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
