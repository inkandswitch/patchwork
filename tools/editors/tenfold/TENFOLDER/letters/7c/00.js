// Eclipse
// By Ivan

params.t = mod(params.t + 0.85)

let U = 64 // segments east-west
let V = 1 + 23 * params.t ** 2 // segments north-south

let rotX = (2 * params.t) ** 3.1
let rotZ = 0.75 + params.t ** 4

let point = (u, v) => {
  let uf = u / U
  let vf = v / V

  let x = sinn(vf) * cosn(uf)
  let z = sinn(vf) * sinn(uf)
  let y = cosn(vf)

  // Rotate around X axis
  let y1 = y * cosn(rotX) - z * sinn(rotX)
  let z1 = y * sinn(rotX) + z * cosn(rotX)

  // Rotate around Z axis
  let x2 = x * cosn(rotZ) - y1 * sinn(rotZ)
  let y2 = x * sinn(rotZ) + y1 * cosn(rotZ)

  return { x: x2, y: y2 }
}

for (let v = 1; v <= V; v++) {
  begin()
  for (let u = 0; u <= U; u++) {
    let vf = v / V

    // point on sphere
    let { x, y } = point(u, v)

    // circle in screenspace
    let cx = denorm(params.t, 4, 0)
    let cy = 0
    let r = 1

    // distance from sphere point to circle
    const dy = y - cy
    const dx = sqrt(r * r - dy * dy)

    // if the point is outside the circle, draw
    if (abs(dy) > r || x > cx + dx || x < cx - dx) {
      line(x, y)
    } else begin()
  }
}
