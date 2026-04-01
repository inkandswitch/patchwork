import type { ControlCtx, Region, HitResult } from "./types.ts"
import { controlBounds } from "./layout.ts"

const N_SPOKES = 24
const LOOP_DURATION = 6 // seconds per cycle
const TAU = Math.PI * 2

// Radial spoke wheel — replaces the horizontal clock wave.
// Spokes radiate from center; thickness and length taper from the "head" (current phase)
// around to the tail. Click outer ring to pause/play in place. Click center to reset + toggle.
export function createTimeControl(
  cc: ControlCtx,
  onTimeUpdate: (t: number) => void,
): { draw(dt: number): void; region: Region } {
  let phase = 0       // accumulates in seconds
  let playing = true
  let startPhase = 0  // phase at drag start
  let startKx = 0     // kx at drag start

  function draw(dt: number) {
    if (playing) phase += dt

    const { ctx, color } = cc
    const { timeCx: cx, timeCy: cy, timeR } = controlBounds(cc)
    const R_OUTER = timeR
    const R_INNER = timeR * 0.28
    const baseStroke = cc.thick * cc.getPixW()
    const W_MIN = baseStroke
    const W_MAX = baseStroke * 3.5 - 2 * cc.getDpr()

    const t = (phase % LOOP_DURATION) / LOOP_DURATION // 0..1
    const headAngle = t * TAU - Math.PI / 2

    ctx.resetTransform()
    ctx.strokeStyle = color
    ctx.lineCap = "round"

    for (let i = 0; i < N_SPOKES; i++) {
      const a = (i / N_SPOKES) * TAU - Math.PI / 2

      let diff = headAngle - a
      diff = ((diff % TAU) + TAU) % TAU
      const behind = diff / TAU
      const factor = (1 - behind) ** 2
      const w = W_MIN + factor * (W_MAX - W_MIN)
      const lenFactor = 0.88 + 0.12 * factor
      const r2 = R_OUTER * lenFactor

      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(cx + R_INNER * Math.cos(a), cy + R_INNER * Math.sin(a))
      ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
      ctx.stroke()
    }

    // Center indicator: short line pointing up
    const R_LINE = R_INNER * 0.9
    ctx.lineWidth = baseStroke
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, cy - R_LINE)
    ctx.stroke()
  }

  const region: Region = {
    cursor: "ew-resize",
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) &&
      h.kx >= controlBounds(cc).timeKxStart &&
      h.kx <= 1 &&
      h.ly > cc.controlsStart &&
      h.ly <= cc.controlsEnd,
    pointerdown(h: HitResult) {
      startPhase = phase
      startKx = h.kx
    },
    frame() {
      const kx = cc.getMouseDragged().kx
      // kx spans 0-1 across the full kaoss pad; map displacement to seconds
      phase = (((startPhase + (kx - startKx) * LOOP_DURATION) % LOOP_DURATION) + LOOP_DURATION) % LOOP_DURATION
      onTimeUpdate(phase / LOOP_DURATION)
    },
  }

  return { draw, region }
}
