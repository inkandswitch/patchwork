// delauney / voronoi by peter
// with assist from orion & claude

const { x, y, q, r, t, s } = params

// DEBUG PENS
const changePen = (color, wt = 0.01) => {
  const ctx = document.querySelector("canvas").getContext("2d")
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = wt
  ctx.beginPath()
}

const randomColor = () => `hsl(${round(random() * 360)}, 100%, 50%)`
const arbitraryColor = (arb) => `hsl(${round(arb)}, 100%, 50%)`
const randomPen = () => changePen(randomColor())
const arbitraryPen = (arb, wt = 0.01) => changePen(arbitraryColor(arb), wt)
const debugPen = () => changePen("#0f0")
const resetPen = () => changePen("#fff")
// END PENS

// DRAWING UTILS
const poly = (shape) => {
  move(shape[0].x, shape[0].y)
  shape.map((pt) => line(pt.x, pt.y))
  line(shape[0].x, shape[0].y)
}

const corners = (points) => {
  points.map((pt) => circle(pt.x, pt.y, 0.03))
}
// END DRAWING

// this is so cool
// https://ianthehenry.com/posts/delaunay/

// BEGIN MATH UTILITIES
function inCircumcircle(point, triangle) {
  const [p1, p2, p3] = triangle
  const ax = p1.x - point.x
  const ay = p1.y - point.y
  const bx = p2.x - point.x
  const by = p2.y - point.y
  const cx = p3.x - point.x
  const cy = p3.y - point.y
  const det = (ax * ax + ay * ay) * (bx * cy - cx * by) - (bx * bx + by * by) * (ax * cy - cx * ay) + (cx * cx + cy * cy) * (ax * by - bx * ay)

  return det > 0
}

const edges = (t) => [
  [t[0], t[1]],
  [t[1], t[2]],
  [t[2], t[0]],
]

function triArea(p1, p2, p3) {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)
}

function ccw([p1, p2, p3]) {
  if (triArea(p1, p2, p3) > 0) {
    return [p1, p2, p3]
  }
  return [p1, p3, p2]
}

function circumcircle(triangle) {
  const [p1, p2, p3] = triangle

  const ax = p1.x,
    ay = p1.y
  const bx = p2.x,
    by = p2.y
  const cx = p3.x,
    cy = p3.y

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))

  if (Math.abs(d) < 1e-10) return null // Collinear points

  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d

  // removed sqrt as it was unnused —Orion
  // const radius = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

  return { center: { x: ux, y: uy } }
}

function pointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y
    const xj = polygon[j].x,
      yj = polygon[j].y

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function segmentIntersectsPolygon(p1, p2, polygon) {
  // Check if line segment p1-p2 intersects any edge of polygon
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const p3 = polygon[j]
    const p4 = polygon[i]

    // Line segment intersection test
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
    if (Math.abs(denom) < 1e-10) continue // Parallel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true // Segments intersect
    }
  }
  return false
}

function polygonCrossesPolygon(poly, boundary) {
  // Check if any edge of poly intersects boundary
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i]
    const p2 = poly[(i + 1) % poly.length]
    if (segmentIntersectsPolygon(p1, p2, boundary)) {
      return true
    }
  }
  return false
}

const pointsContained = (poly, shape) => poly.every((s) => pointInPolygon(s, shape))

const polygonInsideBoundary = (poly, shape) => pointsContained(poly, shape) && !polygonCrossesPolygon(poly, shape)

// END MATH UTILITIES

const delaunayStep = (triangles, point) => {
  const goodTriangles = []
  const badTriangles = []
  triangles.forEach((t) => {
    if (inCircumcircle(point, t)) {
      badTriangles.push(t)
    } else {
      goodTriangles.push(t)
    }
  })

  // The badTriangles will form a group; remove all interior edges
  // (this is generally pretty quick because the groups are small)
  const boundaryEdges = badTriangles
    .map((bT) => edges(bT))
    .flat()
    .filter((edge, i, arr) => {
      let matchCount = 0
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue
        const other = arr[j]
        // Check if same edge (either direction)
        if ((other[0] === edge[0] && other[1] === edge[1]) || (other[0] === edge[1] && other[1] === edge[0])) {
          matchCount++
        }
      }
      return matchCount === 0
    })

  // Now fashion new triangles radiating out from the point
  const newTriangles = boundaryEdges.map((e) => {
    const tri = ccw([e[0], e[1], point])
    // Check all three points
    return tri
  })

  // And our result is the combination of the survivors
  // and the new triangles
  return [...goodTriangles, ...newTriangles]
}
// END DELAUNAY CALCULATIONS

// The voronoi diagram is the dual of the original diagram
const voronoiPolys = (delaunayTriangles) => {
  // Calculate circumcircles once.
  const triangleData = delaunayTriangles.map((t) => ({
    triangle: t,
    circumcenter: circumcircle(t).center,
  }))

  // For each point, find its Voronoi cell
  return s.points
    .map((point) => {
      // Find all triangles that contain this point
      const adjacentTriangles = triangleData.filter((td) => td.triangle.includes(point))

      // Sort these triangles in clockwise order around the point
      // (we'll need to compute angles from the point to each circumcenter)
      const sorted = adjacentTriangles
        .map((td) => ({
          circumcenter: td.circumcenter,
          angle: Math.atan2(td.circumcenter.y - point.y, td.circumcenter.x - point.x),
        }))
        .sort((a, b) => a.angle - b.angle)

      const cell = sorted.map((p) => p.circumcenter)
      return cell
    })
    .filter((c) => c.length > 0)
}

/**
 * ACTUALLY DO THINGS DOWN HERE
 *
 **/

const wigglePoint = (p, i) => ({ x: p.x + smoothRandom(1816 * i) * 0.05, y: p.y + smoothRandom(2123 * i) * 0.05 })

function smoothRandom(seed, speed = 0.2) {
  return sin((seed + params.t * speed) * 12.9898) * cos((seed + params.t * speed) * 78.233)
}

// marcel's outline of letter W
// Replace this with any shape
const Wshape = [
  { x: -1, y: -1 },
  { x: -0.5, y: -1 },
  { x: -0.25, y: 0.2 },
  { x: 0, y: -0.2 },
  { x: 0.25, y: 0.2 },
  { x: 0.5, y: -1 },
  { x: 1, y: -1 },
  { x: 0.75, y: 1 },
  { x: 0.25, y: 1 },
  { x: 0, y: 0.65 },
  { x: -0.25, y: 1 },
  { x: -0.75, y: 1 },
]

// marcel's outline of letter W
// Replace this with any shape
const thk = (q + 1) / 2
const Tshape = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: -1 + thk },
  { x: 1 - (2 - thk) / 2, y: -1 + thk },
  { x: 1 - (2 - thk) / 2, y: 1 },
  { x: -1 + (2 - thk) / 2, y: 1 },
  { x: -1 + (2 - thk) / 2, y: -1 + thk },
  { x: -1, y: -1 + thk },
]

const shape = Wshape

const bigTriangle = [
  { x: 3, y: 2 }, // right
  { x: -3, y: 2 }, // left
  { x: 0, y: -3 }, // top
]

const excludesBigTriangle = (t) => !t.includes(bigTriangle[0]) && !t.includes(bigTriangle[1]) && !t.includes(bigTriangle[2])

let points = []
if (t < 0.7) {
  if (s.points2 || !s.points) {
    delete s.points2 // grody
    s.points = [
      ...shape,
      ...Array(round((q + 2) * 100))
        .fill(undefined)
        .map((p) => ({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
        }))
        .filter((p) => pointInPolygon(p, shape)),
    ]
  }
  const i = floor(s.points.length * (t * 4))
  points = s.points.slice(0, i)
} else {
  if (!s.points2) {
    s.points2 = s.points
  }
  const ratio = 0.8 / s.points2.length
  s.points2 = s.points2.filter(() => Math.random() > ratio)
  points = s.points2
}

points = points.map((p, i) => wigglePoint(p, i))

const delaunayTriangles = points
  .reduce((ts, ps) => delaunayStep(ts, ps), [bigTriangle])
  .filter((t) => polygonInsideBoundary(t, shape))
  .filter((t) => excludesBigTriangle(t))

const vPolys = voronoiPolys(delaunayTriangles)

vPolys.filter((cell) => polygonInsideBoundary(cell, shape))
//.forEach(poly)

delaunayTriangles.forEach((t) => {
  //arbitraryPen(21 + (t[0].x*50));
  polygonInsideBoundary(t, shape)
  poly(t)
})

resetPen()

// which... we aren't r/n.
// finalTriangles.map(poly)
