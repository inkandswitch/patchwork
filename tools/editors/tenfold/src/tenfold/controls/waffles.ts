import type { ControlCtx, Region, HitResult } from "./types.ts"

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v))
const denorm = (n: number, lo = -1, hi = 1) => n * (hi - lo) + lo
const declip = (n: number, lo = 0, hi = 1) => ((n + 1) / 2) * (hi - lo) + lo

// 3x3 grid of draggable dots, one per letter, encoding each letter's q/r parameters.
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

    const gs = 0.025 // size of each dot square
    for (let i = 0; i < 9; i++) {
      const s = opts.states[i]
      ctx.beginPath()
      for (let m = 0; m < 3; m++) {
        for (let n = 0; n < 3; n++) {
          const W = 2 + gap - gs * 3
          const H = waffleEnd - gs * 3
          const X = gs * n + declip(s.q, 0, W)
          const Y = gs * m + declip(s.r, 0, H)
          if (m * 3 + n === i) ctx.fillRect(X, Y, gs, gs)
          api.rect(X, Y, gs, gs)
        }
      }
      ctx.stroke()
    }
  }

  const region: Region = {
    cursor(h: HitResult) {
      for (let p = 0; p < cc.opts.states.length; p++) {
        const s = cc.opts.states[p]
        if (Math.hypot(clamp(denorm(h.kx)) - s.q, clamp(denorm(h.ky)) - s.r) < 0.15) return "move"
      }
      return "default"
    },
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) && h.kx >= 0 && h.kx <= 1 && h.ky >= 0 && h.ky <= 1,
    pointerdown(h: HitResult) {
      dragParam = null
      let closestDist = 0.3 // must be within this distance for the drag to register
      for (let p = 0; p < cc.opts.states.length; p++) {
        const s = cc.opts.states[p]
        const dist = Math.hypot(clamp(denorm(h.kx)) - s.q, clamp(denorm(h.ky)) - s.r)
        if (dist >= closestDist) continue
        dragParam = p
        closestDist = dist
      }
      if (dragParam == null) return false
      if (performance.now() - lastWaffled < 300) {
        cc.opts.set(dragParam, "q", dragParam / 4 - 1)
        cc.opts.set(dragParam, "r", (Math.random() - 0.5) / 5)
      }
      lastWaffled = performance.now()
    },
    drag(_start: HitResult, h: HitResult) {
      if (dragParam == null) return
      cc.opts.set(dragParam, "q", clamp(denorm(h.kx)))
      cc.opts.set(dragParam, "r", clamp(denorm(h.ky)))
    },
  }

  return { draw, region }
}
