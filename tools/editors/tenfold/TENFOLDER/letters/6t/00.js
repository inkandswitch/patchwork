// Controllable T
// by John

// Waffle x: Serif length
// Waffle y: Top bar curve
// Mouse x: Rotation of T
// Mouse y: Vertical and horizontal

let curv = declip(params.r, 0, 1) //0.3
let fancyLen = declip(params.q, 0, 0.4)
let rx = declip(params.y, 0.3, 0.9)
let ry = declip(params.y, 0.3, 0.9)

function drawT(xOffset) {
  let rot = curv * (fancyLen / 0.4)
  move(-rx + xOffset, -ry + curv)
  quadratic(-0.5 + xOffset, -ry, xOffset, -ry)
  quadratic(0.5 + xOffset, -ry, rx + xOffset, -ry + curv)
  if (fancyLen > 0) {
    move(-rx - rot + xOffset, -ry + curv - fancyLen)
    line(-rx + rot + xOffset, -ry + curv + fancyLen)
    move(rx + rot + xOffset, -ry + curv - fancyLen)
    line(rx - rot + xOffset, -ry + curv + fancyLen)
  }

  move(xOffset, -ry)
  line(xOffset, ry)
  move(xOffset - fancyLen, ry)
  line(xOffset + fancyLen, ry)
}
let tCount = declip(params.x, 1, 6)

let offsets = [0, 0.05, 0.1, 0.15, 0.2, 0.25]
for (let i = 0; i < tCount; i++) {
  drawT(offsets[i])
  drawT(-offsets[i])
}
