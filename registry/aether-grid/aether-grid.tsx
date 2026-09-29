"use client"

import * as React from "react"

import { qx } from "@/lib/quack-elements"

type AetherDirection = "top" | "right" | "bottom" | "left"

type AetherGridProps = React.ComponentProps<"div"> & {
  direction?: AetherDirection
  origin?: AetherDirection
  gridSize?: number
  cellSize?: number
  squareSize?: number
  gap?: number
  density?: number
  fadeStart?: number
  fadeEnd?: number
  falloff?: number
  minBrightness?: number
  color?: string
  squareColor?: string
  backgroundColor?: string
  intensity?: number
  opacity?: number
  dpr?: number
  speed?: number
  shimmer?: number
  twinkleSpeed?: number
  twinkleStrength?: number
  seed?: number
}

const TAU = Math.PI * 2

function hash(x: number, y: number, seed: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function originStrength(
  x: number,
  y: number,
  columns: number,
  rows: number,
  direction: AetherDirection
) {
  const normalizedX = columns <= 1 ? 0 : x / (columns - 1)
  const normalizedY = rows <= 1 ? 0 : y / (rows - 1)

  if (direction === "left") return 1 - normalizedX
  if (direction === "right") return normalizedX
  if (direction === "top") return 1 - normalizedY
  return normalizedY
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function resolveCanvasColor(value: string, element: HTMLElement) {
  const variable = value.match(/^var\(\s*(--[\w-]+)(?:\s*,\s*([^)]+))?\s*\)$/)
  if (!variable) return value

  return (
    window.getComputedStyle(element).getPropertyValue(variable[1]).trim() ||
    variable[2]?.trim() ||
    "#f59e0b"
  )
}

function AetherGrid({
  className,
  children,
  direction,
  origin,
  gridSize = 52,
  cellSize,
  squareSize,
  gap,
  density = 1,
  fadeStart = 0.33,
  fadeEnd = 1,
  falloff = 1.25,
  minBrightness = 0.55,
  color,
  squareColor,
  backgroundColor = "#050505",
  intensity = 1,
  opacity = 1,
  dpr = 1.5,
  speed,
  shimmer,
  twinkleSpeed,
  twinkleStrength,
  seed = 17,
  ...props
}: AetherGridProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    const context = canvas?.getContext("2d")

    if (!canvas || !container || !context) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const activeDirection = direction ?? origin ?? "right"
    const safeGridSize = clamp(gridSize, 8, 200)
    const safeDensity = clamp(density, 0, 1)
    const safeFadeStart = clamp(fadeStart, 0, 0.98)
    const safeFadeEnd = clamp(fadeEnd, safeFadeStart + 0.01, 1)
    const safeFalloff = Math.max(0.25, falloff)
    const safeMinBrightness = clamp(minBrightness, 0, 1)
    const safeIntensity = Math.max(0, intensity)
    const safeOpacity = clamp(opacity, 0, 1)
    const safeDpr = clamp(dpr, 1, 3)
    const safeSpeed = Math.max(0, twinkleSpeed ?? speed ?? 1.4)
    const safeShimmer = clamp(twinkleStrength ?? shimmer ?? 0.94, 0, 1)
    let width = 0
    let height = 0
    let resolvedColor = resolveCanvasColor(squareColor ?? color ?? "#f59e0b", container)
    let resolvedBackground = resolveCanvasColor(backgroundColor, container)

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const renderDpr = Math.min(window.devicePixelRatio || 1, safeDpr)
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      canvas.width = Math.round(width * renderDpr)
      canvas.height = Math.round(height * renderDpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(renderDpr, 0, 0, renderDpr, 0, 0)
    }

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height)
      context.fillStyle = resolvedBackground
      context.fillRect(0, 0, width, height)

      const longAxis = Math.max(width, height)
      const gridStep = cellSize === undefined
        ? longAxis / safeGridSize
        : Math.max(1, cellSize)
      const squareRatio = clamp(
        squareSize ?? (gap === undefined ? 0.57 : 1 - gap / gridStep),
        0.05,
        0.98
      )
      const renderedSquareSize = gridStep * squareRatio
      const columns = Math.ceil(width / gridStep)
      const rows = Math.ceil(height / gridStep)
      const elapsed = time / 1000

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const strength = originStrength(column, row, columns, rows, activeDirection)
          const fadeProgress = clamp(
            (strength - safeFadeStart) / (safeFadeEnd - safeFadeStart),
            0,
            1
          )
          const envelope = Math.pow(fadeProgress, safeFalloff)
          const existence = hash(column, row, seed)
          const constellation = hash(column + 41, row + 73, seed)
          const threshold = safeDensity * envelope * (0.84 + constellation * 0.24)

          if (existence > threshold) continue

          const phase = hash(column + 13, row + 29, seed) * TAU
          const tempo = 0.65 + hash(column + 89, row + 7, seed) * 0.55
          const pulse = (Math.sin(elapsed * safeSpeed * tempo * TAU + phase) + 1) / 2
          const glint = pulse * pulse
          const brightness = safeMinBrightness +
            (1 - safeMinBrightness) * (1 - safeShimmer + glint * safeShimmer)
          const variation = 0.76 + hash(column + 3, row + 97, seed) * 0.24
          const alpha = clamp(
            brightness * variation * (0.3 + envelope * 0.7) * safeIntensity * safeOpacity,
            0,
            1
          )
          const inset = (gridStep - renderedSquareSize) / 2

          context.globalAlpha = alpha
          context.fillStyle = resolvedColor
          context.fillRect(
            column * gridStep + inset,
            row * gridStep + inset,
            renderedSquareSize,
            renderedSquareSize
          )
        }
      }

      context.globalAlpha = 1

      if (!reducedMotion.matches && safeSpeed > 0) {
        frameRef.current = window.requestAnimationFrame(draw)
      }
    }

    const restart = () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      draw(0)
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      restart()
    })

    const themeObserver = new MutationObserver(() => {
      resolvedColor = resolveCanvasColor(squareColor ?? color ?? "#f59e0b", container)
      resolvedBackground = resolveCanvasColor(backgroundColor, container)
      restart()
    })

    resizeObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette", "style"],
    })
    reducedMotion.addEventListener("change", restart)
    resize()
    restart()

    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      reducedMotion.removeEventListener("change", restart)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [
    backgroundColor,
    cellSize,
    color,
    density,
    direction,
    dpr,
    fadeEnd,
    fadeStart,
    falloff,
    gap,
    gridSize,
    intensity,
    minBrightness,
    opacity,
    origin,
    seed,
    shimmer,
    squareSize,
    squareColor,
    speed,
    twinkleSpeed,
    twinkleStrength,
  ])

  return (
    <div
      data-qe-slot="aether-grid"
      className={qx("relative isolate overflow-hidden bg-black", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 size-full"
      />
      <div data-qe-slot="aether-grid-content" className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export { AetherGrid }
export type { AetherDirection, AetherGridProps }
