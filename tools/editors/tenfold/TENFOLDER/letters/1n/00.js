// VINE-EN
// By Marcel

__loopBudget = 50000

// Move waffle to increase / decrease density
const density = floor(((params.q + 1) / 2) * 1000 + 200)

// LIBRARY
// draw a polygon
function poly(points) {
  begin()
  for (const pt of points) {
    line(pt.x, pt.y)
  }
  line(points[0].x, points[0].y)
}

// is a point inside a polygon
function isInPoly(point, poly) {
  let inside = false

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]

    // Check if the horizontal ray from 'point' crosses the edge (a,b)
    const intersects = a.y > point.y !== b.y > point.y && point.x <= ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x

    if (intersects) inside = !inside
  }

  return inside
}

// Give me a random distribution of points
function randomPoints(amount) {
  const points = []
  for (let i = 0; i < amount; i++) {
    points.push({
      x: rand(),
      y: rand(),
    })
  }
  return points
}

// distance between two points
function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Vector math
function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y }
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y }
}

function mulS(a, s) {
  return { x: a.x * s, y: a.y * s }
}

function divS(a, s) {
  return { x: a.x / s, y: a.y / s }
}

function len(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y)
}

function norm(a) {
  return divS(a, len(a))
}

// Outline of letter N
// Replace this with any shape
const shape = [
  { x: -1, y: -1 },
  { x: -0.5, y: -1 },
  { x: 0.5, y: 0.25 },
  { x: 0.5, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: 0.5, y: 1 },
  { x: -0.5, y: -0.25 },
  { x: -0.5, y: 1 },
  { x: -1, y: 1 },
]

let state = window.treeNState
if (!state || params.t <= 0.01 || state.density != density) {
  state = {
    targets: randomPoints(density).filter((pt) => isInPoly(pt, shape)),
    segments: [{ x: -0.75, y: 0.75, dx: 0.1, dy: 0, parent: null }],
    targetIndex: 0,
    density,
  }
  window.treeNState = state
}

// Grow the tree
if (state.targets.length > 0) {
  for (let t = 0; t < 10; t++) {
    if (state.targets.length == 1) break

    let i = state.targetIndex

    state.targetIndex = (state.targetIndex + 1) % (state.targets.length - 1)
    let target = state.targets[i]
    // Find closest segment to target
    let foundSegment = null
    let foundIndex = null
    let foundDist = 0.3

    for (let j = 0; j < state.segments.length; j++) {
      let seg = state.segments[j]
      let d = dist(seg, target)
      if (d < foundDist) {
        foundDist = d
        foundSegment = seg
        foundIndex = j
      }
    }

    if (foundSegment) {
      if (foundDist < 0.1) {
        // Close enough, remove target
        state.targets.splice(i, 1)
        continue
      }

      // Grow that segment
      const delta = mulS(sub(target, foundSegment), 1.2)
      const olddir = { x: foundSegment.dx, y: foundSegment.dy }
      const newdir = mulS(norm(add(olddir, delta)), 0.1)
      const newpos = add(foundSegment, newdir)
      const newseg = {
        parent: foundIndex,
        x: newpos.x,
        y: newpos.y,
        dx: newdir.x,
        dy: newdir.y,
      }
      foundSegment.pass = true
      if (state.segments.length < 1000) {
        state.segments.push(newseg)
      }
    }
  }
}

for (const s of state.segments) {
  if (s.parent == null) continue
  const b = state.segments[s.parent]
  begin()
  move(s.x, s.y)
  line(b.x, b.y)
  if (!s.pass) circle(s.x, s.y, 0.02)
}
