import type { ControlCtx } from "./types.ts"

// Draws the & glyph in the left cell of the control surface row.
// Currently static; structured so it can accept a community-authored draw function later
// (same api+params interface as letter draw functions).
export function drawAmpersand(cc: ControlCtx) {
  const { ctx, api, padding, pitch, color } = cc
  const pixW = cc.getPixW()
  const pixHW = cc.getPixHW()

  ctx.resetTransform()
  ctx.translate(padding * pixW, (pitch + padding) * pixW)
  ctx.scale(pixHW, pixHW) // clip letter space: -1 to 1
  ctx.translate(1, 1)
  ctx.lineWidth = 2 * cc.thick
  ctx.strokeStyle = color
  ctx.fillStyle = color

  const r = 0.3
  ctx.beginPath()
  api.arc(0, -0.5, r, 0, -0.25, true)
  api.arc(-0.75, -0.5, r, -0.25, 0.25, true)
  api.line(-0.6, -0.2)
  api.move(-0.6, -0.1)
  api.arc(-0.75, 0.2, r, -0.25, -0.5, true)
  api.arc(-0.75, 0.8, r, 0.5, 0.25, true)
  api.arc(0.5, 0.8, r, 0.25, 0, true)
  api.line(0.8, 0.5)
  api.line(0.8 - 0.8, 0.5 + 0.1)
  api.move(0.8, 0.5)
  api.line(0.8 + 0.4, 0.5 - 0.05)
  ctx.stroke()

  ctx.beginPath()
  api.circle(0.8, 0.5, 0.04)
  ctx.fill()
}
