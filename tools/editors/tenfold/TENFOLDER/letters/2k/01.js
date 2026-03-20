// K
// by Paul

let y = -1
let x = 0

const STEP = 0.1
const VARIANCE = renorm(sinn(params.t), 0, 1, 0.2, 0.3)

let direction = { x: 0, y: 1 }

const random = seededRandom(100)

const BIAS_X = 0
const BIAS_Y = 1
const TOTAL_MARKERS = 17

const markers = []
for (let i = 0; i < TOTAL_MARKERS; i++) {
  markers.push({
    pos: {
      y: -1,
      x: i * (2 / TOTAL_MARKERS) - 1,
    },
    dir: {
      x: 0,
      y: 1,
    },
  })
}

do {
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i]
    const shift = renorm(random(), 0, 1, -VARIANCE, VARIANCE)
    const next = markers[i + 1]

    m.dir = rotate(m.dir.x, m.dir.y, shift)

    const biasX = i > TOTAL_MARKERS / 2 ? m.pos.y * renorm(i / markers.length, 0, 1, 0.3, 0.8) : 0
    const biasY = 1

    m.dir.x = (m.dir.x + biasX) / 2
    m.dir.y = (m.dir.x + biasY) / 2

    if (next) {
      m.dir.x = (next.dir.x * 3 + m.dir.x) / 4
      m.dir.y = (next.dir.y * 3 + m.dir.y) / 4
    }

    move(m.pos.x, m.pos.y)

    m.pos.x += m.dir.x * STEP
    m.pos.y += m.dir.y * STEP

    if (m.pos.y < 1) {
      line(m.pos.x, m.pos.y)
    }
  }
} while (markers.some((m) => m.pos.y < 1))

function seededRandom(seed) {
  let state = seed

  return function () {
    // Linear Congruential Generator algorithm
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}
