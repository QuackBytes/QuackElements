"use client"

import * as React from "react"

import { qx } from "@/lib/quack-elements"

type PrismTilesDirection =
  | "top-to-bottom"
  | "bottom-to-top"
  | "left-to-right"
  | "right-to-left"
  | "top-left-to-bottom-right"
  | "top-right-to-bottom-left"
  | "bottom-left-to-top-right"
  | "bottom-right-to-top-left"

type PrismTilesPattern = "ribbon" | "arc" | "twist"

type PrismTilesProps = React.ComponentProps<"div"> & {
  width?: string | number
  height?: string | number
  direction?: PrismTilesDirection
  pattern?: PrismTilesPattern
  speed?: number
  opacity?: number
  chromaticSpread?: number
  tileDensity?: number
  rippleLayers?: number
  warpStrength?: number
  bandSharpness?: number
  colorA?: string
  colorB?: string
  backgroundColor?: string
  dpr?: number
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
    "#ffffff"
  )
}

function colorToRgb(value: string, element: HTMLElement) {
  const color = resolveCanvasColor(value, element).trim()
  const shortHex = color.match(/^#([\da-f])([\da-f])([\da-f])$/i)
  const longHex = color.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  const rgb = color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)

  if (shortHex) {
    return shortHex.slice(1).map((channel) => Number.parseInt(`${channel}${channel}`, 16) / 255)
  }

  if (longHex) {
    return longHex.slice(1).map((channel) => Number.parseInt(channel, 16) / 255)
  }

  if (rgb) {
    return rgb.slice(1).map((channel) => Number.parseFloat(channel) / 255)
  }

  return [1, 1, 1]
}

function directionToVector(direction: PrismTilesDirection) {
  const vectors: Record<PrismTilesDirection, [number, number]> = {
    "top-to-bottom": [0, -1],
    "bottom-to-top": [0, 1],
    "left-to-right": [1, 0],
    "right-to-left": [-1, 0],
    "top-left-to-bottom-right": [Math.SQRT1_2, -Math.SQRT1_2],
    "top-right-to-bottom-left": [-Math.SQRT1_2, -Math.SQRT1_2],
    "bottom-left-to-top-right": [Math.SQRT1_2, Math.SQRT1_2],
    "bottom-right-to-top-left": [-Math.SQRT1_2, Math.SQRT1_2],
  }

  return vectors[direction]
}

function patternToIndex(pattern: PrismTilesPattern) {
  return { ribbon: 0, arc: 1, twist: 2 }[pattern]
}

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_opacity;
  uniform float u_chromaticSpread;
  uniform float u_tileDensity;
  uniform float u_rippleLayers;
  uniform float u_warpStrength;
  uniform float u_bandSharpness;
  uniform float u_pattern;
  uniform vec2 u_direction;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_background;

  float roundedBox(vec2 p, float extent, float radius) {
    vec2 q = abs(p) - extent + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  // A continuous light source behind the glass, in square-cell coordinates.
  // The harmonics change the waveform itself, rather than duplicating stripes.
  float lightDistance(vec2 p) {
    vec2 tangent = vec2(-u_direction.y, u_direction.x);
    float along = dot(p, u_direction);
    float across = dot(p, tangent);
    float wave = 0.0;
    for (int i = 0; i < 8; i++) {
      float layer = float(i) + 1.0;
      if (layer <= u_rippleLayers) {
        wave += sin(across * (0.72 + layer * 0.31)
          + u_time * (0.12 + layer * 0.025) + layer * 1.7)
          * 0.48 / (layer * layer);
      }
    }
    if (u_pattern < 0.5) {
      float phase = along - u_time * 0.24 + wave;
      return sin(phase * 0.72) / 0.72;
    }

    if (u_pattern < 1.5) {
      vec2 arcSpace = vec2(across * 0.76, along * 0.42 + 2.35);
      float phase = length(arcSpace) - u_time * 0.18 + wave * 0.14;
      return sin(phase * 1.18) / 1.18;
    }

    float twist = sin(across * 0.82 + u_time * 0.11) * 0.72;
    float first = sin((along - u_time * 0.22 + twist) * 0.78) / 0.78;
    float second = sin((along - u_time * 0.22 - twist + 2.65) * 0.78) / 0.78;
    return min(abs(first), abs(second));
  }

  vec3 lightField(vec2 p, float blur) {
    float distance = lightDistance(p);
    float width = 0.040 / sqrt(u_bandSharpness) + blur;
    float filteredWidth = width;
    #ifdef HAS_DERIVATIVES
      // The lens can compress a ribbon below one pixel at its perimeter.
      // Integrate that footprint to keep the glass edge from shimmering.
      filteredWidth = max(width, min(fwidth(distance) * 0.7, 0.12));
    #endif
    float spread = u_chromaticSpread * 0.065;
    vec3 distances = vec3(distance - spread, distance, distance + spread);
    vec3 core = exp(-pow(distances / filteredWidth, vec3(2.0))) * width / filteredWidth;
    float halo = exp(-abs(distance) / (0.105 + blur * 2.0));
    float bloom = exp(-abs(distance) / 0.32);
    float hue = 0.64 + 0.23 * sin(p.x * 0.32 + p.y * 0.24 - u_time * 0.08);
    vec3 tint = mix(u_colorA, u_colorB, hue);
    return tint * (halo * 1.15 + bloom * 0.32)
      + mix(tint, vec3(1.0), 0.22) * core * 2.1;
  }

  void main() {
    float cellSize = min(u_resolution.x, u_resolution.y) / u_tileDensity;
    vec2 world = (gl_FragCoord.xy - u_resolution * 0.5) / cellSize;
    // Keep the lattice square at every aspect ratio, with partial edge tiles.
    vec2 grid = world + vec2(0.18, 0.0);
    vec2 cell = floor(grid) + 0.5;
    vec2 p = fract(grid) - 0.5;
    float aa = 1.0 / cellSize;
    float sdf = roundedBox(p, 0.493, 0.065);
    float mask = 1.0 - smoothstep(-aa, aa, sdf);
    float depth = max(-sdf, 0.0);

    // A thick asymmetric glass lens. The inverse edge distances compress the
    // light into hooked caustics at the foot and sides of each individual pane.
    // This remaps the source BEFORE sampling it; highlights follow the light.
    vec2 edge = max(vec2(0.018), 0.5 - abs(p));
    float sideLens = 0.28 / max(0.015, p.x + 0.505)
      + 0.045 / max(0.015, 0.505 - p.x) - 0.65;
    float verticalLens = 0.18 / max(0.012, p.y + 0.505)
      - 0.012 / max(0.012, 0.505 - p.y) - 0.336;
    vec2 refracted = grid;
    refracted.y -= u_warpStrength * (sideLens + verticalLens);
    refracted.x += u_warpStrength * p.x * 0.028 / (edge.x + 0.025);

    // Fold the outer bevel back over the scene: a second internal reflection
    // makes the narrow paired highlights and dark seam of polished glass.
    float bevel = exp(-depth * 42.0) * mask;
    vec2 normal = normalize(p * pow(abs(p) + 0.001, vec2(7.0)) + 0.00001);
    vec2 reflected = refracted - normal * (0.11 + depth * 4.0);
    vec3 transmitted = lightField(refracted, 0.002);
    vec3 reflection = lightField(reflected, 0.008);
    vec3 tint = mix(u_colorA, u_colorB, 0.72);

    float rim = exp(-abs(sdf + 0.008) / max(aa * 0.65, 0.002));
    float innerRim = exp(-abs(sdf + 0.028) / max(aa * 0.75, 0.003));
    float groove = exp(-abs(sdf + 0.018) / max(aa, 0.004));
    float bottom = exp(-max(p.y + 0.47, 0.0) * 38.0);
    float left = exp(-max(p.x + 0.47, 0.0) * 45.0);
    float edgeLight = 0.24 + 0.76 * (0.5 + 0.5 * sin(cell.x * 0.63 + cell.y * 0.8 + u_time * 0.22));
    float fresnel = 0.035 + 0.65 * pow(1.0 - smoothstep(0.0, 0.13, depth), 3.0);

    vec3 glass = u_background + tint * 0.004;
    glass += transmitted * (0.8 + fresnel * 0.65);
    glass += reflection * bevel * 0.22;
    glass *= 1.0 - groove * 0.72;
    glass += tint * (rim * 0.30 + innerRim * 0.15) * edgeLight;
    glass += tint * (bottom + left * 0.45) * 0.032;
    glass += reflection * (rim * 0.7 + innerRim * 0.5);

    vec3 gap = u_background * 0.32;
    vec3 color = mix(gap, glass, mask);
    float vignette = 1.0 - 0.22 * pow(length((gl_FragCoord.xy / u_resolution - 0.5) * 1.25), 2.0);
    // Filmic rolloff preserves the pink-white core without clipping the bloom.
    color = 1.0 - exp(-max(color, 0.0) * vignette);
    gl_FragColor = vec4(mix(u_background, color, u_opacity), 1.0);
  }
`
function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function PrismTiles({
  className,
  children,
  width = "100%",
  height = "100%",
  direction = "top-to-bottom",
  pattern = "ribbon",
  speed = 1,
  opacity = 1,
  chromaticSpread = 0,
  tileDensity = 4,
  rippleLayers = 6,
  warpStrength = 0.33,
  bandSharpness = 3,
  colorA = "#1e00ff",
  colorB = "#d765e6",
  backgroundColor = "#05030a",
  dpr = 1.5,
  style,
  ...props
}: PrismTilesProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const frameRef = React.useRef<number | null>(null)
  const elapsedRef = React.useRef(0)
  const [contextVersion, restoreContext] = React.useReducer((value: number) => value + 1, 0)

  React.useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    })

    if (!gl) return

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const derivativeSupport = gl.getExtension("OES_standard_derivatives")
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER,
      (derivativeSupport ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES\n" : "")
      + fragmentShaderSource
    )
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, "a_position")
    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      opacity: gl.getUniformLocation(program, "u_opacity"),
      chromaticSpread: gl.getUniformLocation(program, "u_chromaticSpread"),
      tileDensity: gl.getUniformLocation(program, "u_tileDensity"),
      rippleLayers: gl.getUniformLocation(program, "u_rippleLayers"),
      warpStrength: gl.getUniformLocation(program, "u_warpStrength"),
      bandSharpness: gl.getUniformLocation(program, "u_bandSharpness"),
      pattern: gl.getUniformLocation(program, "u_pattern"),
      direction: gl.getUniformLocation(program, "u_direction"),
      colorA: gl.getUniformLocation(program, "u_colorA"),
      colorB: gl.getUniformLocation(program, "u_colorB"),
      background: gl.getUniformLocation(program, "u_background"),
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const safeSpeed = clamp(speed, 0, 3)
    const safeOpacity = clamp(opacity, 0, 1)
    const safeChromaticSpread = clamp(chromaticSpread, 0, 1)
    const safeTileDensity = clamp(tileDensity, 1, 16)
    const safeRippleLayers = Math.round(clamp(rippleLayers, 1, 8))
    const safeWarpStrength = clamp(warpStrength, 0, 0.6)
    const safeBandSharpness = clamp(bandSharpness, 0.5, 10)
    const safeDpr = clamp(dpr, 1, 3)
    const directionVector = directionToVector(direction)
    const patternIndex = patternToIndex(pattern)
    let renderWidth = 0
    let renderHeight = 0
    let resolvedColorA = colorToRgb(colorA, container)
    let resolvedColorB = colorToRgb(colorB, container)
    let resolvedBackground = colorToRgb(backgroundColor, container)
    let lastTimestamp: number | null = null
    let inView = true
    let contextLost = false

    const stop = () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      lastTimestamp = null
    }

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const renderDpr = Math.min(window.devicePixelRatio || 1, safeDpr)
      const canvasWidth = Math.max(1, bounds.width)
      const canvasHeight = Math.max(1, bounds.height)
      renderWidth = Math.round(canvasWidth * renderDpr)
      renderHeight = Math.round(canvasHeight * renderDpr)
      canvas.width = renderWidth
      canvas.height = renderHeight
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
      gl.viewport(0, 0, renderWidth, renderHeight)
    }

    const draw = (timestamp: number) => {
      frameRef.current = null
      if (contextLost) return
      if (lastTimestamp !== null && !reducedMotion.matches) {
        elapsedRef.current += Math.min((timestamp - lastTimestamp) / 1000, 0.05) * safeSpeed
      }
      lastTimestamp = timestamp
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(uniforms.resolution, renderWidth, renderHeight)
      gl.uniform1f(uniforms.time, elapsedRef.current)
      gl.uniform1f(uniforms.opacity, safeOpacity)
      gl.uniform1f(uniforms.chromaticSpread, safeChromaticSpread)
      gl.uniform1f(uniforms.tileDensity, safeTileDensity)
      gl.uniform1f(uniforms.rippleLayers, safeRippleLayers)
      gl.uniform1f(uniforms.warpStrength, safeWarpStrength)
      gl.uniform1f(uniforms.bandSharpness, safeBandSharpness)
      gl.uniform1f(uniforms.pattern, patternIndex)
      gl.uniform2f(uniforms.direction, directionVector[0], directionVector[1])
      gl.uniform3fv(uniforms.colorA, resolvedColorA)
      gl.uniform3fv(uniforms.colorB, resolvedColorB)
      gl.uniform3fv(uniforms.background, resolvedBackground)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      if (!reducedMotion.matches && safeSpeed > 0 && inView && !document.hidden) {
        frameRef.current = window.requestAnimationFrame(draw)
      }
    }

    const restart = () => {
      stop()
      draw(performance.now())
    }

    const visibilityChanged = () => {
      if (document.hidden || !inView) stop()
      else restart()
    }
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      visibilityChanged()
    })
    const loseContext = (event: Event) => {
      event.preventDefault()
      contextLost = true
      stop()
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      restart()
    })

    const themeObserver = new MutationObserver(() => {
      resolvedColorA = colorToRgb(colorA, container)
      resolvedColorB = colorToRgb(colorB, container)
      resolvedBackground = colorToRgb(backgroundColor, container)
      restart()
    })

    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette", "style"],
    })
    reducedMotion.addEventListener("change", restart)
    document.addEventListener("visibilitychange", visibilityChanged)
    canvas.addEventListener("webglcontextlost", loseContext)
    canvas.addEventListener("webglcontextrestored", restoreContext)
    resize()
    restart()

    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      reducedMotion.removeEventListener("change", restart)
      document.removeEventListener("visibilitychange", visibilityChanged)
      canvas.removeEventListener("webglcontextlost", loseContext)
      canvas.removeEventListener("webglcontextrestored", restoreContext)
      stop()
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [
    backgroundColor,
    bandSharpness,
    chromaticSpread,
    colorA,
    colorB,
    contextVersion,
    dpr,
    direction,
    opacity,
    pattern,
    rippleLayers,
    speed,
    tileDensity,
    warpStrength,
  ])

  return (
    <div
      data-qe-slot="prism-tiles"
      className={qx("relative isolate overflow-hidden", className)}
      style={{ width, height, backgroundColor, ...style }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 size-full"
      />
      <div data-qe-slot="prism-tiles-content" className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export { PrismTiles }
export type { PrismTilesDirection, PrismTilesPattern, PrismTilesProps }

