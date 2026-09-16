export type QuackStaticClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | QuackStaticClassValue[]
  | Record<string, boolean | null | undefined>

export type QuackClassValue<State> =
  | QuackStaticClassValue
  | ((state: State) => QuackStaticClassValue)

export function qx(...values: QuackStaticClassValue[]): string
export function qx<State>(
  ...values: QuackClassValue<State>[]
): string | ((state: State) => string)
export function qx<State>(
  ...values: QuackClassValue<State>[]
): string | ((state: State) => string) {
  const dynamic = values.some((value) => typeof value === "function")

  if (dynamic) {
    return (state: State) =>
      joinStaticValues(
        values.map((value) =>
          typeof value === "function" ? value(state) : value
        )
      )
  }

  return joinStaticValues(values as QuackStaticClassValue[])
}

function joinStaticValues(values: QuackStaticClassValue[]): string {
  return values.flatMap(resolveClassValue).filter(Boolean).join(" ")
}

function resolveClassValue(value: QuackStaticClassValue): string[] {
  if (!value) return []
  if (typeof value === "string" || typeof value === "number") return [String(value)]
  if (Array.isArray(value)) return value.flatMap(resolveClassValue)

  return Object.entries(value)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([className]) => className)
}
