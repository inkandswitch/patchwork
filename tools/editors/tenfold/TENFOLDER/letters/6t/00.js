// rive-T
// by Alex Warth

let h = 0.9
let v = 0.7

const points = [
  { x: -h/2, y: -v/3 },
  { x: -3/4*h, y: v },
  { x: 3/4*h, y: v },
  { x: h/2, y: -v/3 },
  { x: -h, y: -v/3 },
  { x: h, y: -v/3 },
  { x: 0, y: 0 },
];

const lines = [
  { p1: points[0], p2: points[1] },
  { p1: points[1], p2: points[2] },
  { p1: points[2], p2: points[3] },
  { p1: points[3], p2: points[1] },
  { p1: points[0], p2: points[2] },
  { p1: points[4], p2: points[5] },
];

const arcs = [
  { c: points[6], a: points[4], b: points[5] }
]

let scale = 1000

points.forEach(p => {
  p.x *= scale
  p.y *= scale
})

// constraints

function eqDist(a, b, c, d) {
  return () => abs(pointDist(a, b) - pointDist(c, d))
}

function hOrV(p1, p2) {
  return () => min(abs(p1.x - p2.x), abs(p1.y - p2.y))
}

function pointOnLine(p, v, w) {
  return () => pointDistToLineSegment(p, v, w)
}

const constraints = [
  hOrV(points[0], points[1]),
  hOrV(points[1], points[2]),
  hOrV(points[2], points[3]),
  pointOnLine(points[0], points[4], points[5]),
  pointOnLine(points[3], points[4], points[5]),
  pointOnLine(points[6], points[0], points[2]),
  pointOnLine(points[6], points[3], points[1]),
  eqDist(points[6], points[4], points[6], points[5]),
];

function totalError() {
  return constraints.
    map(c => c() ** 2).
    reduce((a, b) => a + b, 0)
}

function relax() {
  let ans = false;
  points.forEach(p => {
    ans =
      relaxWithVar(p, 'x') ||
      relaxWithVar(p, 'y') ||
      ans
  })
  return ans
}

const epsilon = 4

function relaxWithVar(obj, key) {
  const origValue = obj[key];
  const errorToBeat = max(0, totalError() - epsilon)

  obj[key] = origValue + epsilon
  const ePlusEpsilon = totalError()

  obj[key] = origValue - epsilon
  const eMinusEpsilon = totalError()

  if (ePlusEpsilon < min(errorToBeat, eMinusEpsilon)) {
    obj[key] = origValue + epsilon;
    return true;
  } else if (eMinusEpsilon < min(errorToBeat, ePlusEpsilon)) {
    obj[key] = origValue - epsilon;
    return true;
  } else {
    obj[key] = origValue;
    return false;
  }
}

// add noise
points.forEach((p, idx) => {
  p.x *= 1 + (1 + (idx % 3)) * .07 * (idx % 2 === 0 ? 1 : -1)
  p.y *= 1 + (1 + (idx % 4)) * .09
})

for (let idx = 0; idx < params.t * 250; idx++) {
  const didSomething = relax()
  if (!didSomething) {
    // console.log('broke early', idx)
    break;
  }
}

points.forEach(p => {
  p.x /= scale
  p.y /= scale
})

// render
lines.forEach(({ p1, p2 }) => {
  move(p1.x, p1.y)
  line(p2.x, p2.y)
})
const TAU = 2 * PI
arcs.forEach(({ c, a, b }) => {
  const r = pointDist(c, a)
  const theta1 = atan2(a.y - c.y, a.x - c.x) / TAU;
  const theta2 = atan2(b.y - c.y, b.x - c.x) / TAU;
  arc(c.x, c.y, r, theta1, theta2);
})

// ----- helpers -----

function pointDist(a, b) {
  return sqrt(pointDist2(a, b));
}

function pointDist2(a, b) {
  return pow(a.x - b.x, 2) + pow(a.y - b.y, 2);
}
function pointDistToLineSegment(p, v, w) {
  return sqrt(pointDistToLineSegment2(p, v, w));
}

function pointDistToLineSegment2(p, v, w) {
  const l = pointDist2(v, w);
  if (l == 0) {
    return pointDist2(p, v);
  }

  const t = max(0, min(((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l, 1));
  return pointDist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function pointDist2(a, b) {
  return pow(a.x - b.x, 2) + pow(a.y - b.y, 2);
}