import { drawText } from "../font.ts"
import type { ControlCtx, Region, HitResult } from "./types.ts"

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v))
const denorm = (n: number, lo = -1, hi = 1) => n * (hi - lo) + lo
const declip = (n: number, lo = 0, hi = 1) => ((n + 1) / 2) * (hi - lo) + lo

// 9 independent vertical strips, one per letter.
// Each strip is a 2D control: q (horizontal, limited range) and r (vertical, full range).
// Each letter is rendered as a text label (e.g. "I01", "N07") instead of a dot.
export function createWaffles(cc: ControlCtx): { draw(): void; region: Region } {
  let dragParam: number | null = null
  let lastWaffled = performance.now()

  function draw() {
    const { ctx, api, padding, pitch, gap, waffleEnd, opts, color } = cc
    const pixW = cc.getPixW()

    ctx.resetTransform()
    ctx.translate((pitch + padding) * pixW, (pitch + padding) * pixW)
    ctx.scale(pixW, pixW)
    ctx.lineWidth = cc.thick
    ctx.strokeStyle = color
    ctx.fillStyle = color

    const charWidth = 0.05
    const charSize = 0.08
    const charHeight = 0.055

    const topPad = padding
    const totalW = 2 + gap
    const stripW = totalW / 9
    const labelW = charWidth * 3 // 3 chars: e.g. "I01"
    const dotW = stripW - labelW // horizontal range within strip
    const H = waffleEnd - topPad - charHeight // vertical range

    const word = opts.word

    for (let i = 0; i < 9; i++) {
      const s = opts.states[i]
      const stripX = stripW * i
      const label = word[i] + s.i.toString().padStart(2, "0")
      const X = stripX + declip(s.q, 0, dotW)
      const Y = topPad + declip(s.r, 0, H)

      ctx.beginPath()
      drawText(api, label, X, Y - charHeight / 2, charSize, charWidth)
      ctx.stroke()
    }
  }

  const region: Region = {
    cursor(h: HitResult) {
      const strip = Math.floor(h.kx * 9)
      if (strip < 0 || strip > 8) return "default"
      return "grab"
    },
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) && h.kx >= 0 && h.kx <= 1 && h.ky >= 0 && h.ky <= 1,
    pointerdown(h: HitResult) {
      const strip = clamp(Math.floor(h.kx * 9), 0, 8)
      dragParam = strip

      if (performance.now() - lastWaffled < 300) {
        cc.opts.set(dragParam, "q", (Math.random() - 0.5) / 2)
        cc.opts.set(dragParam, "r", (Math.random() - 0.5) / 5)
      }
      lastWaffled = performance.now()
    },
    drag(_start: HitResult, h: HitResult) {
      if (dragParam == null) return
      const stripKx = h.kx * 9 - dragParam
      cc.opts.set(dragParam, "q", clamp(denorm(stripKx)))
      cc.opts.set(dragParam, "r", clamp(denorm(h.ky)))
    },
  }

  return { draw, region }
}
