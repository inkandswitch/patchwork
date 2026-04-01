import type { ControlCtx } from "./types.ts"

// Shared sizing for the three controls in the strip below the waffles.
// All three share the same height. Chaos is flush left, time flush right,
// sound fills the space between them.
export function controlBounds(cc: ControlCtx) {
  const pixW = cc.getPixW()
  const dpr = cc.getDpr()
  const { padding, pitch, gap, controlsStart, controlsEnd } = cc

  const kaossLeft = (padding + pitch) * pixW
  const kaossRight = (padding + pitch + 2 + gap) * pixW
  const kaossPxW = (2 + gap) * pixW

  const stripTop = (padding + pitch + controlsStart) * pixW
  const stripH = (controlsEnd - controlsStart) * pixW
  // Orange line in screenshot ≈ 62% down the strip
  const stripCy = stripTop + stripH * 0.62

  // Each control occupies one third of the kaoss pad width.
  // Chaos and time use a reduced radius (~60% of max) to leave breathing room.
  const slotW = kaossPxW / 3
  const controlR = Math.min(slotW, stripH) * 0.40

  // kx boundaries: exact thirds
  const chaosKxEnd = 1 / 3
  const timeKxStart = 2 / 3

  // Chaos: nudged 30px right to open a gap between it and the ampersand
  const chaosR = controlR
  const chaosCx = kaossLeft + chaosR + 30 * dpr
  const chaosCy = stripCy

  // Time: flush right — nudged down slightly to offset visual weight of thick head spokes
  const timeR = controlR
  const timeCx = kaossRight - timeR
  const timeCy = stripCy + timeR * 0.15

  // Sound: nudged 15px right to follow chaos's shift and keep balance
  const soundLeft = kaossLeft + slotW
  const soundRight = kaossRight - slotW
  const soundW = soundRight - soundLeft
  const soundCx = soundLeft + soundW / 2 + 15 * dpr
  const soundCy = stripCy
  const controlH = stripH

  return {
    stripTop, stripH, stripCy, controlH,
    chaosCx, chaosCy, chaosR,
    timeCx, timeCy, timeR,
    soundCx, soundCy, soundW, soundH: controlH,
    chaosKxEnd, timeKxStart,
  }
}
