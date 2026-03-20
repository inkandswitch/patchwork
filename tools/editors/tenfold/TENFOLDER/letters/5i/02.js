// The I System
// by John

// Waffle y: giant spacecraft's y

let rx = 0.8
let ry = 0.8
move(-rx, -ry + 0.3)
quadratic(-0.5, -ry, 0, -ry)
line(rx, -ry)
move(-rx, ry)
line(0, ry)
quadratic(0.5, ry, rx, ry - 0.3)
move(0, -ry)
line(0, ry)

circle(0, 0, 0.1)
circle(0, 0, 0.1 + rand(-0.1, 0.1))

// Semi-major axis is the longest radius of an ellipse
// Semi-minor axis is perpendicular to the semi-major axis.
function orbit(t, semiMajor, semiMinor) {
  let angle = t * PI * 2
  let x = cos(angle) * semiMajor
  let y = sin(angle) * semiMinor
  return { x, y }
}

begin(true)
let o = orbit(params.t, 0.3, 0.32)
circle(o.x, o.y, 0.01)

let o2 = orbit(params.t - 0.2, 0.4, 0.45)
circle(o2.x, o2.y, 0.02)

let o3 = orbit(params.t - 0.4, 0.55, 0.6)
circle(o3.x, o3.y, 0.03)

let o4 = orbit(params.t + 0.05, 0.7, 0.72)
circle(o4.x, o4.y, 0.05)

let o5 = orbit(params.t - 0.8, 0.7, 0.45)
circle(o5.x, o5.y, 0.025)

let o6 = orbit(params.t - 0.5, 0.35, 0.37)
circle(o6.x, o6.y, 0.015)

let planets = [o, o2, o3, o4, o5, o6]

let declipT = denorm(params.t, -1, 1)
let sy = params.r
if (params.r < 0) {
  sy = -min(abs(sy), ry)
} else {
  sy = min(sy, ry)
}
for (let i = 1; i < 6; i++) {
  circle(declipT - i / 53, sy, 0.005 * i)
}
let sx = declipT - 1 / 53

for (let planet of planets) {
  if (abs(sx - planet.x) < 0.05 && abs(sy - planet.y) < 0.05) {
    goRed()
  }
}
if (abs(sx) < 0.15 && abs(sy) < 0.15) goRed()
