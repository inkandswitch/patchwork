import type { ControlCtx, Region, HitResult } from "./types.ts"
import { controlBounds } from "./layout.ts"

// Harmonics state — randomized once, fixed per session
const H = 8
const xF = [1.0, 2.17, 3.61, 5.09, 6.83, 8.71, 10.9, 13.2]
const yF = [1.73, 3.11, 4.79, 6.47, 8.23, 10.1, 12.3, 14.7]
const am = [0.28, 0.21, 0.16, 0.12, 0.09, 0.06, 0.04, 0.03]

function makeHarmonics() {
  const xP: number[] = []
  const yP: number[] = []
  const xD: number[] = []
  const yD: number[] = []
  const amSp: number[] = []
  const amPh: number[] = []
  const fmSp: number[] = []
  const fmPh: number[] = []
  for (let i = 0; i < H; i++) {
    xP[i] = Math.random() * 6.28318
    yP[i] = Math.random() * 6.28318
    xD[i] = (0.35 + i * 0.12) * (Math.random() < 0.5 ? 1 : -1)
    yD[i] = (0.3 + i * 0.13) * (Math.random() < 0.5 ? 1 : -1)
    amSp[i] = 0.1 + Math.random() * 0.18
    amPh[i] = Math.random() * 6.28318
    fmSp[i] = 0.06 + Math.random() * 0.12
    fmPh[i] = Math.random() * 6.28318
  }
  return { xP, yP, xD, yD, amSp, amPh, fmSp, fmPh }
}

// Chaos switch: a Lissajous-style harmonic orbit that morphs between a clean ellipse (off)
// and a chaotic multi-harmonic figure (on). Click to toggle.
export function createChaosControl(cc: ControlCtx): {
  draw(dt: number): void
  region: Region
  on: boolean
} {
  const h = makeHarmonics()
  let elapsed = 0
  let mix = 0
  let target = 0
  const SPEED = 2.0
  const N = 2400

  const state = { on: false }

  function draw(dt: number) {
    const { ctx, color } = cc

    elapsed += dt

    // Advance harmonic phases
    for (let i = 0; i < H; i++) {
      h.xP[i] += h.xD[i] * dt
      h.yP[i] += h.yD[i] * dt
    }

    // Smooth mix toward target
    if (mix < target) mix = Math.min(mix + SPEED * dt, 1)
    if (mix > target) mix = Math.max(mix - SPEED * dt, 0)
    const m = mix * mix * (3 - 2 * mix) // smooth step

    // Current amplitudes and freq modulation
    const curAm: number[] = []
    const curXF: number[] = []
    const curYF: number[] = []
    for (let j = 0; j < H; j++) {
      curAm[j] = am[j] * (1 + 0.25 * Math.sin(elapsed * h.amSp[j] + h.amPh[j]))
      curXF[j] = xF[j] * (1 + 0.06 * Math.sin(elapsed * h.fmSp[j] + h.fmPh[j]))
      curYF[j] = yF[j] * (1 + 0.06 * Math.sin(elapsed * h.fmSp[j] * 1.3 + h.fmPh[j] + 2.1))
    }

    // Starting point for loop closure
    let sdx0 = 0
    let sdy0 = 0
    for (let j = 0; j < H; j++) {
      sdx0 += curAm[j] * Math.cos(curXF[j] * 0 + h.xP[j])
      sdy0 += curAm[j] * Math.sin(curYF[j] * 0 + h.yP[j])
    }

    const { chaosCx: cx, chaosCy: cy, chaosR: baseR } = controlBounds(cc)
    const Rs = baseR * (1 + 0.4 * m)
    const baseStroke = cc.thick * cc.getPixW()

    ctx.resetTransform()
    ctx.strokeStyle = color
    ctx.lineWidth = baseStroke
    ctx.lineCap = "round"
    ctx.beginPath()

    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 6.28318
      // Clean lissajous: simple 3:5 figure
      const lx = Math.sin(3 * t + elapsed * 0.785)
      const ly = Math.sin(5 * t) * Math.abs(Math.cos(3 * t + elapsed * 0.785))

      // Chaotic: sum of harmonics
      let sx = 0
      let sy = 0
      for (let j = 0; j < H; j++) {
        sx += curAm[j] * Math.cos(curXF[j] * t + h.xP[j])
        sy += curAm[j] * Math.sin(curYF[j] * t + h.yP[j])
      }

      // Smooth loop closure
      const bl = Math.max(0, (i / N - 0.9) / 0.1)
      const ease = bl * bl * (3 - 2 * bl)
      sx += (sdx0 - sx) * ease
      sy += (sdy0 - sy) * ease

      const dx = lx * (1 - m) + sx * m
      const dy = ly * (1 - m) + sy * m

      // Clip to circle
      const d = Math.sqrt(dx * dx + dy * dy)
      const scale = d > 1 ? 1 / d : 1

      if (i === 0) {
        ctx.moveTo(cx + dx * scale * Rs, cy + dy * scale * Rs)
      } else {
        ctx.lineTo(cx + dx * scale * Rs, cy + dy * scale * Rs)
      }
    }

    ctx.closePath()
    ctx.stroke()
  }

  const region: Region = {
    cursor: "pointer",
    test: (h: HitResult) =>
      (h.i === 4 || h.i === 5) &&
      h.kx >= 0 &&
      h.kx < controlBounds(cc).chaosKxEnd &&
      h.ly > cc.controlsStart &&
      h.ly <= cc.controlsEnd,
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
