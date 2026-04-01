import type { ControlCtx, Region, HitResult } from "./types.ts"

const N_SPOKES = 36
const LOOP_DURATION = 6 // seconds per cycle
const TAU = Math.PI * 2

// Radial spoke wheel — replaces the horizontal clock wave.
// Spokes radiate from center; thickness and length taper from the "head" (current phase)
// around to the tail. Click outer ring to pause/play in place. Click center to reset + toggle.
export function createTimeControl(
  cc: ControlCtx,
  onTimeUpdate: (t: number) => void,
): { draw(dt: number): void; region: Region } {
  let phase = 0  // accumulates in seconds
  let playing = true

  function draw(dt: number) {
    if (playing) phase += dt

    const { ctx, color } = cc
    const cssW = cc.getCssW()
    const dpr = cc.getDpr()
    const { padding, pitch, gap, controlsStart, controlsEnd } = cc

    // Slot 2 (right third of kaoss pad, kx 2/3..1)
    const kaossLeft = (padding + pitch) * cssW * dpr
    const kaossPxW = (2 + gap) * cssW * dpr
    const slotPxW = kaossPxW / 3
    const stripPxH = (controlsEnd - controlsStart) * cssW * dpr
    const cx = kaossLeft + slotPxW * 2.5 // center of slot 2
    const cy = (padding + pitch + controlsStart) * cssW * dpr + stripPxH * 0.5
    const slotR = Math.min(slotPxW, stripPxH) * 0.42
    const R_OUTER = slotR
    const R_INNER = slotR * 0.28
    const baseStroke = cc.thick * cc.getPixW()
    const W_MIN = baseStroke
    const W_MAX = baseStroke * 3.5

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
    cursor: "pointer",
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) &&
      h.kx >= 2 / 3 &&
      h.kx <= 1 &&
      h.ly > cc.controlsStart &&
      h.ly <= cc.controlsEnd,
    pointerdown() {
      playing = !playing
      onTimeUpdate((phase % LOOP_DURATION) / LOOP_DURATION)
    },
  }

  return { draw, region }
}
