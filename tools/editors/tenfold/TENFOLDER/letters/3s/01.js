// Shapessss
// By Marcel
// Use the waffle to tweak amount / density of shapes

// Library
// draw a polygon
function poly(points) {
  begin()
  for (const pt of points) {
    line(pt.x, pt.y)
  }
}

function pointToPathDistance(point, path) {
  if (!Array.isArray(path) || path.length < 2) return null

  let minDist = Infinity

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    const d = pointToSegmentDistance(point, a, b)
    if (d < minDist) minDist = d
  }

  return minDist
}

function pointToSegmentDistance(p, a, b) {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const apx = p.x - a.x
  const apy = p.y - a.y

  const abLenSq = abx * abx + aby * aby
  if (abLenSq === 0) {
    // segment is a point
    return Math.hypot(p.x - a.x, p.y - a.y)
  }

  // projection factor clamped to segment
  let t = (apx * abx + apy * aby) / abLenSq
  t = Math.max(0, Math.min(1, t))

  const projX = a.x + t * abx
  const projY = a.y + t * aby

  return Math.hypot(p.x - projX, p.y - projY)
}

function prng(x, y) {
  // map [-1,1] → [0, 2^16)
  const ix = ((x + 1) * 32767) | 0
  const iy = ((y + 1) * 32767) | 0

  // combine
  let v = ix ^ (iy * 0x9e3779b1)

  // scramble
  v ^= v << 13
  v ^= v >>> 17
  v ^= v << 5

  // map to [0,1)
  return (v >>> 0) / 4294967296
}

// S SHape
const path = [
  { x: 0.5, y: -0.5 },
  { x: 0.25, y: -0.8 },
  { x: -0.25, y: -0.8 },
  { x: -0.5, y: -0.5 },
  { x: -0.5, y: -0.25 },
  { x: -0.25, y: 0 },
  { x: 0.25, y: 0 },
  { x: 0.5, y: 0.25 },
  { x: 0.5, y: 0.5 },
  { x: 0.25, y: 0.8 },
  { x: -0.25, y: 0.8 },
  { x: -0.5, y: 0.5 },
].map((p) => {
  return {
    x: p.x + sinn(params.t) * 0.1 * p.y, // bend amount
    y: p.y,
  }
})

//poly(path)

const shapes = [
  (x, y, d) => {
    for (let i = 0; i <= d; i += 0.01) {
      circle(x, y, i)
    }
  },
  (x, y, d) => {
    for (let i = 0; i <= d; i += d * 0.5) {
      circle(x, y, i)
    }
  },
  (x, y, d) => {
    begin()
    if (prng(x, y) > 0.5) {
      move(x - d / 2, y - d / 2)
      line(x + d / 2, y + d / 2)
      line(x + d / 2, y - d / 2)
      line(x - d / 2, y - d / 2)
    } else {
      move(x - d / 2, y - d / 2)
      line(x + d / 2, y + d / 2)
      line(x - d / 2, y + d / 2)
      line(x - d / 2, y - d / 2)
    }
  },
  (x, y, d) => {
    rect(x - d / 4, y - d / 4, d / 2, d / 2)
  },
  (x, y, d) => {
    if (prng(x, y) > 0.5) {
      move(x - d / 4, y - d / 4)
      line(x + d / 4, y + d / 4)
    } else {
      move(x + d / 4, y - d / 4)
      line(x - d / 4, y + d / 4)
    }
  },
]

const steps = 5 + (params.q + 1) * 8
const saturation = 5 + (params.r + 1) * 15
for (let x = 0; x < steps; x++) {
  for (let y = 0; y < steps; y++) {
    const pt = {
      x: clip(x, 0, steps - 1),
      y: clip(y, 0, steps - 1),
    }

    const offsetPt = {
      x: pt.x,
      y: pt.y,
    }
    const d = pointToPathDistance(offsetPt, path)
    const i = max(0, floor(d * saturation) - 1)
    if (shapes[i]) {
      shapes[i](pt.x, pt.y, 1 / steps)
    }
  }
}
