import type { ControlCtx, Region, HitResult } from "./types.ts"
import { controlBounds } from "./layout.ts"

const GRID_N = 9     // N×N isometric tiles
const GRID_CW = 0.9  // tile width in normalized units (relative to control slot)

// Sound switch: an isometric grid plane that animates wave spikes when on.
// Click to toggle audio on/off.
export function createSoundControl(cc: ControlCtx): {
  draw(dt: number): void
  region: Region
  on: boolean
} {
  let elapsed = 0
  let mix = 0
  let target = 0
  const SPEED = 3.0
  const state = { on: false }

  function draw(dt: number) {
    const { ctx, color } = cc

    elapsed += dt

    // Smooth mix toward target
    if (mix < target) mix = Math.min(mix + SPEED * dt, 1)
    if (mix > target) mix = Math.max(mix - SPEED * dt, 0)
    const m = mix * mix * (3 - 2 * mix) // smoothstep

    const t = (elapsed / 4) % 1

    const { soundCx: slotCx, soundCy, soundW, soundH: slotPxH } = controlBounds(cc)
    const slotTop = soundCy - slotPxH / 2
    const slotPxW = soundW

    // Constrain tile size so the full grid fits within the control height.
    // Isometric grid vertical span ≈ GRID_N * CW; reserve ~60% of height for grid body.
    const CW_byWidth = GRID_CW * (slotPxW / (GRID_N * 1.5))
    const CW_byHeight = (slotPxH * 0.6) / GRID_N
    const CW = Math.min(CW_byWidth, CW_byHeight)
    const CH = CW / 2
    const AMP_CENTER = slotPxH * 0.45
    const AMP_FALLOFF = 1.6
    const BASE_Y = slotTop + slotPxH * 0.25

    ctx.resetTransform()

    // Build node grid
    const nodes: { x: number; y: number }[][] = []
    for (let row = 0; row <= GRID_N; row++) {
      const rp: { x: number; y: number }[] = []
      for (let col = 0; col <= GRID_N; col++) {
        const sx = slotCx + (col - row) * CW
        const sy_base = BASE_Y + (col + row) * CH
        let h = 0
        const nc = (col / GRID_N - 0.5) * 2
        const nr = (row / GRID_N - 0.5) * 2
        const amp = AMP_CENTER * Math.exp(-(nc * nc + nr * nr) * AMP_FALLOFF)
        const wave = Math.abs(
          Math.sin(col * 1.9 + t * 6.28318 * 1) * Math.sin(row * 2.7 + t * 6.28318 * 1) * 0.65 +
            Math.sin(col * 0.7 + row * 1.9 + t * 6.28318 * 2) * 0.35,
        )
        // Interpolate between idle (0.18) and full (1.0) amplitude
        h = amp * (0.18 + 0.82 * m) * wave
        rp.push({ x: sx, y: sy_base - h })
      }
      nodes.push(rp)
    }

    // Sort tiles back-to-front
    const cells: [number, number, number][] = []
    for (let row = 0; row < GRID_N; row++) {
      for (let col = 0; col < GRID_N; col++) {
        cells.push([col, row, col + row])
      }
    }
    cells.sort((a, b) => a[2] - b[2])

    for (const [col, row] of cells) {
      const A = nodes[row][col]
      const B = nodes[row][col + 1]
      const C = nodes[row + 1][col + 1]
      const D = nodes[row + 1][col]

      // Punch a hole behind the tile (destination-out) so elevated tiles occlude lower ones
      ctx.globalCompositeOperation = "destination-out"
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.lineTo(C.x, C.y)
      ctx.lineTo(D.x, D.y)
      ctx.closePath()
      ctx.fillStyle = "#000"
      ctx.fill()

      // Draw tile outline
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = color
      ctx.lineWidth = cc.thick * cc.getPixW()
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.lineTo(C.x, C.y)
      ctx.lineTo(D.x, D.y)
      ctx.closePath()
      ctx.stroke()
    }

    ctx.globalCompositeOperation = "source-over"
  }

  const region: Region = {
    cursor: "pointer",
    test: (h: HitResult) => {
      const { chaosKxEnd, timeKxStart } = controlBounds(cc)
      return (h.i === 4 || h.i === 5) &&
        h.kx >= chaosKxEnd &&
        h.kx < timeKxStart &&
        h.ly > cc.controlsStart &&
        h.ly <= cc.controlsEnd
    },
    pointerdown() {
      state.on = !state.on
      target = state.on ? 1 : 0
    },
  }

  return {
    draw,
    region,
    get on() { return state.on },
    set on(v: boolean) { state.on = v; target = v ? 1 : 0 },
  }
}
