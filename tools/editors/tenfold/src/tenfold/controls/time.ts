import type { ControlCtx, Region, HitResult } from "./types.ts"
import { controlBounds } from "./layout.ts"

const N_SPOKES = 24
const TAU = Math.PI * 2
const DRAG_THRESHOLD = 4 // css pixels before click becomes drag
const SNAP_ZONE = 0.04   // normalized t zone around 0 for magnetic snap

// Radial spoke wheel — visualizes the current animation time.
// Click to pause/play. Drag to scrub. Snap to zero when crossing the start.
// Click the center indicator to pause at t=0.
export function createTimeControl(
  cc: ControlCtx,
  onTimeUpdate: (t: number) => void,
): { draw(dt: number, t: number): void; region: Region; playing: boolean } {
  let playing = true
  let dragging = false
  let currentT = 0        // latest t, saved from draw() for use in pointerdown
  let dragStartT = 0
  let dragStartKx = 0
  let scrubT = 0          // current scrubbed value during drag

  function draw(_dt: number, t: number) {
    currentT = t

    const { ctx, color } = cc
    const { timeCx: cx, timeCy: cy, timeR } = controlBounds(cc)
    const R_OUTER = timeR
    const R_INNER = timeR * 0.28
    const baseStroke = cc.thick * cc.getPixW()
    const W_MIN = baseStroke
    const W_MAX = baseStroke * 3.5 - 2 * cc.getDpr()

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

    // Pause indicator: two vertical bars at center
    if (!playing) {
      const barH = R_INNER * 0.5
      const barGap = R_INNER * 0.08 + baseStroke
      ctx.lineWidth = baseStroke * 1.5
      ctx.beginPath()
      ctx.moveTo(cx - barGap, cy - barH / 2)
      ctx.lineTo(cx - barGap, cy + barH / 2)
      ctx.moveTo(cx + barGap, cy - barH / 2)
      ctx.lineTo(cx + barGap, cy + barH / 2)
      ctx.stroke()
    }
  }

  // Check if a hit is near the center indicator (inner circle area)
  function isNearCenter(h: HitResult): boolean {
    const { timeCx, timeCy, timeR } = controlBounds(cc)
    const pixW = cc.getPixW()
    const dpr = cc.getDpr()
    // Convert hit kx/ly to pixel coords
    const px = (cc.padding + cc.pitch + h.kx * (2 + cc.gap)) * pixW
    const py = (cc.padding + cc.pitch + h.ly) * pixW
    const dist = Math.hypot(px - timeCx, py - timeCy)
    return dist < timeR * 0.35
  }

  const region: Region = {
    cursor: (h: HitResult) => isNearCenter(h) ? "pointer" : "ew-resize",
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) &&
      h.kx >= controlBounds(cc).timeKxStart &&
      h.kx <= 1 &&
      h.ly > cc.controlsStart &&
      h.ly <= cc.controlsEnd,
    pointerdown(h: HitResult) {
      const wasPlaying = playing
      dragging = false
      dragStartT = currentT
      dragStartKx = h.kx
      scrubT = currentT

      const startX = cc.getMouseDragged()?.x ?? 0
      const startY = cc.getMouseDragged()?.y ?? 0

      const onMove = (e: PointerEvent) => {
        if (dragging) return // already promoted to drag
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          dragging = true
          playing = false
        }
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        if (!dragging) {
          // It was a click
          if (isNearCenter(h)) {
            // Click center → pause at start
            playing = false
            onTimeUpdate(0)
          } else {
            // Click elsewhere → toggle play/pause
            playing = !wasPlaying
          }
        }
        dragging = false
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp, { once: true })
    },
    frame() {
      if (!dragging) {
        // Hold t steady while pointer is down but not yet dragging
        onTimeUpdate(scrubT)
        return
      }
      const kx = cc.getMouseDragged().kx
      // Map horizontal displacement to time offset (full kx range = one full cycle)
      let newT = dragStartT + (kx - dragStartKx)
      newT = ((newT % 1) + 1) % 1

      // Magnetic snap near zero (the "start" / centerline)
      const distToZero = Math.min(newT, 1 - newT)
      if (distToZero < SNAP_ZONE) {
        newT = 0
      }

      scrubT = newT
      onTimeUpdate(newT)
    },
  }

  const control = {
    draw,
    region,
    get playing() { return playing },
    set playing(v: boolean) { playing = v },
  }

  return control
}
