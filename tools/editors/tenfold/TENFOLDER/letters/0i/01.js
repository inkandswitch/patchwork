// Catenoid
// By Todd and Ivan!!

// A 3d wireframe made from vertically-stacked circles that are
// small near the origin and get larger as they travel up/down.

// We first generate vertices for the shape,
// then scale them to fit perfectly in view,
// and finally draw wiry edges between them.

// You can drag on the catenoid to adjust the number of segments
let U = round(declip(params.x, 3, 24)) // segments round the circle
let V = round(declip(params.y, 2, 20)) // segments along the curve

let rad = 0.1 // minimum circle radius
let a = params.r + 1.4 // amount of curvature — waffle control

// You can rotate the shape in 3d
let rotX = params.q * 0.03 + 0.03 // waffle control
let rotY = params.t / U // animation
let rotZ = 0 // not used yet :)

// We need to store the points and their bounding box
let points = []
let lo = { x:0, y:0 }
let hi = { x:0, y:0 }

// This helper function generates points on the surface
// of the catenoid shape, and then rotates them in 3d.
let point = (u, v) => {
  let y = clip(v / V)
  let x = rad + a * cosh(y / a) - a
  let z = 0
  
  let uf = u / U - 0.25
  let x1 = x * cosn(uf) - z * sinn(uf)
  let z1 = x * sinn(uf) + z * cosn(uf)

  // Rotate around Y axis first
  let x2 = x1 * cosn(rotY) - z1 * sinn(rotY)
  let z2 = x1 * sinn(rotY) + z1 * cosn(rotY)

  // Rotate around X axis
  let y1 = y * cosn(rotX) - z2 * sinn(rotX)
  let z3 = y * sinn(rotX) + z2 * cosn(rotX)

  // Rotate around Z axis last
  let x3 = x2 * cosn(rotZ) - y1 * sinn(rotZ)
  let y2 = x2 * sinn(rotZ) + y1 * cosn(rotZ)

  return { x: x3, y: y2 }
}

// build all points, and track the bounds
for (let v = 0; v <= V; v++) {
  for (let u = 0; u < U; u++) {
    let p = point(u, v)
    points.push(p)
    lo.x = min(p.x, lo.x)
    hi.x = max(p.x, hi.x)
    lo.y = min(p.y, lo.y)
    hi.y = max(p.y, hi.y)
  }
}

// Normalize points to clip space
for (let p of points) {
  p.x = renorm(p.x, lo.x, hi.x)
  p.y = renorm(p.y, lo.y, hi.y)
}

// Draw the circles (horizontal)
for (let v = 0; v <= V; v++) {
  begin()
  for (let u = 0; u <= U; u++) {
    let {x, y} = points[mod(u, U) + v * U]
    line(x, y)
  }
}

// Draw the curves (vertical)
for (let u = 0; u < U; u++) {
  begin()
  for (let v = 0; v <= V; v++) {
    let {x, y} = points[u + v * U]
    line(x, y)
  }
}