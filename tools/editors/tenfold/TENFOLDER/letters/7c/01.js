// A-mazing C
// by marcel

const letter = "C"

const fonts = ["Arial", "Helvetica", "Verdana", "Tahoma", "Trebuchet MS", "Times New Roman", "Times", "Georgia", "Courier New", "Courier"]

// Use waffle to scrub font & resolution
const size = floor(20 + ((params.q + 1) / 2) * 30)
const fontIndex = floor(((params.r + 1) / 2) * fonts.length + 1)
const width = size
const height = size

let state = window.mazeCState
if (!state || params.t <= 0.01 || size != state.size || fontIndex != state.fontIndex) {
  state = initMazeState(width, height)
  window.mazeCState = state
}

function initMazeState(width, height) {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => true))

  // Stolen from ivanovich
  let enca = new OffscreenCanvas(width, height)
  let enc = enca.getContext("2d", { alpha: true, willReadFrequently: true })

  enc.scale(width, height)
  const font = fonts[fontIndex]
  enc.font = "1.1px " + font
  enc.textAlign = "center"
  enc.fillStyle = "#fff"
  enc.fillText(letter, 0.5, 0.85)

  let data = enc.getImageData(0, 0, width, height).data

  // mark inaccessible region
  // here as an example: a circle mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let d = data[(x + y * height) * 4] >= 128
      if (!d) {
        grid[y][x] = null // inaccessible
      }
    }
  }

  const start = pickValidStart(grid, width, height)

  grid[start[0]][start[1]] = false

  return {
    grid,
    size,
    fontIndex,
    stack: [start],
    done: false,
  }
}

function pickValidStart(grid, width, height) {
  function randOdd(limit) {
    let r = Math.floor(Math.random() * limit)
    return r % 2 === 0 ? r + 1 : r
  }

  let iter = 0
  while (iter < 1000) {
    iter++
    const sy = randOdd(height - 1)
    const sx = randOdd(width - 1)

    if (grid[sy][sx] === true) {
      return [sy, sx]
    }
  }
}

function touchesNull(grid, y, x) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [dy, dx] of dirs) {
    const ny = y + dy
    const nx = x + dx
    if (grid[ny] && grid[ny][nx] === null) return true
  }
  return false
}

function stepCarve(state, stepsPerFrame = 20) {
  const { grid, stack } = state

  const directions = [
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0],
  ]

  for (let i = 0; i < stepsPerFrame; i++) {
    if (!stack.length) {
      state.done = true
      return
    }

    const [y, x] = stack[stack.length - 1]

    const dirs = directions.slice().sort(() => Math.random() - 0.5)

    let carved = false

    for (const [dy, dx] of dirs) {
      const ny = y + dy
      const nx = x + dx

      if (ny > 0 && ny < height && nx > 0 && nx < width && grid[ny][nx]) {
        grid[y + dy / 2][x + dx / 2] = false
        grid[ny][nx] = false
        stack.push([ny, nx])
        carved = true
        break
      }
    }

    if (!carved) {
      stack.pop()
    }
  }
}

// ---------- FRAME LOOP ----------

// advance carving a bit each frame
if (!state.done) {
  stepCarve(state, 1) // adjust speed here
}

const cs = 2 / size

for (let y = 0; y < width; y++) {
  for (let x = 0; x < height; x++) {
    if (state.grid[y][x]) {
      const pt = {
        x: clip(x, 0, width - 1),
        y: clip(y, 0, height - 1),
      }
      begin(true)
      rect(pt.x, pt.y, cs, cs)
    }
  }
}
