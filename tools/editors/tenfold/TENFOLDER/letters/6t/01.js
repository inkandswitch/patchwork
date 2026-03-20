// go make a letter - pvh
// aka: go-t
const COLS = 19
const ROWS = 19

const SPACING_X = 2 / COLS
const SPACING_Y = 2 / ROWS
const RADIUS = SPACING_X * 0.5 * 0.85

/** Go Rules
 * as provided by claude
 */

// Get neighbors (up, down, left, right)
const getNeighbors = (x, y) => {
  const neighbors = []
  if (x > 0) neighbors.push([x - 1, y])
  if (x < COLS - 1) neighbors.push([x + 1, y])
  if (y > 0) neighbors.push([x, y - 1])
  if (y < ROWS - 1) neighbors.push([x, y + 1])
  return neighbors
}

// Find all stones in a connected group using flood fill
const getGroup = (goBoard, x, y, visited = new Set()) => {
  const key = `${x},${y}`
  if (visited.has(key)) return []

  const stone = goBoard[x][y]
  if (stone === undefined) return []

  visited.add(key)
  const group = [[x, y]]

  for (const [nx, ny] of getNeighbors(x, y)) {
    if (goBoard[nx][ny] === stone) {
      group.push(...getGroup(goBoard, nx, ny, visited))
    }
  }

  return group
}

// Count liberties (empty adjacent points) for a group
const countLiberties = (goBoard, group) => {
  const liberties = new Set()

  for (const [x, y] of group) {
    for (const [nx, ny] of getNeighbors(x, y)) {
      if (goBoard[nx][ny] === undefined) {
        liberties.add(`${nx},${ny}`)
      }
    }
  }

  return liberties.size
}

// Remove captured stones and return count of captures
const captureStones = (goBoard, player) => {
  const opponent = !player
  let capturedCount = 0
  const visited = new Set()

  // Check all opponent stones
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`
      if (goBoard[x][y] === opponent && !visited.has(key)) {
        const group = getGroup(goBoard, x, y, visited)
        const liberties = countLiberties(goBoard, group)

        // If group has no liberties, capture it!
        if (liberties === 0) {
          for (const [gx, gy] of group) {
            goBoard[gx][gy] = undefined
            capturedCount++
          }
        }
      }
    }
  }

  return capturedCount
}

const n = [
  "                   ",
  "     ####          ",
  "    ######         ",
  "    ######         ",
  " #############     ",
  "###############    ",
  " #############     ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######         ",
  "    ######     ##  ",
  "    ######    ###  ",
  "    #############  ",
  "     ###########   ",
]
const goalBoard = n.map((l) => l.split("").map((v) => v == "#"))

// Initialize the Go board: undefined = empty, false = black, true = white
if (params.t < 0.03) {
  params.s.goBoard = Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(undefined))
}

const goBoard = params.s.goBoard

const pickLocation = (goBoard, goalBoard, player) => {
  // Build a list of valid empty positions in the goal for this player
  const validPositions = []

  for (let y = 0; y < ROWS; y++) {
    if (Math.random() < 0.01) {
      // 10% of the time, just pick randomly
      for (let attempts = 0; attempts < 100; attempts++) {
        const x = floor(Math.random() * COLS)
        const y = floor(Math.random() * ROWS)
        if (goBoard[x][y] === undefined) {
          return [x, y]
        }
      }
    }

    for (let x = 0; x < COLS; x++) {
      // Check if this position matches the player's goal and is empty
      const isPlayerGoal = goalBoard[y][x] === player
      const isEmpty = goBoard[x][y] === undefined

      if (isPlayerGoal && isEmpty) {
        validPositions.push([x, y])
      }
    }
  }

  // If we have valid positions, pick one randomly
  if (validPositions.length > 0) {
    const randomIndex = floor(Math.random() * validPositions.length)
    return validPositions[randomIndex]
  }

  // Fallback: pick any empty space if no goal positions available
  for (let attempts = 0; attempts < 100; attempts++) {
    const x = floor(Math.random() * COLS)
    const y = floor(Math.random() * ROWS)
    if (goBoard[x][y] === undefined) {
      return [x, y]
    }
  }

  // Ultimate fallback
  return [0, 0]
}

const playMove = (goBoard, player) => {
  let x, y
  let attempts = 0
  do {
    attempts++
    ;[x, y] = pickLocation(goBoard, goalBoard, player)
  } while (attempts < 10 && goBoard[x][y] !== undefined)

  if (goBoard[x][y] === undefined) {
    goBoard[x][y] = player
    // After placing a stone, check for captures
    const captured = captureStones(goBoard, player)
    if (captured > 0) {
      // You could track captures here if you want
    }
  }
}

params.s.lastMove = !params.s.lastMove
playMove(goBoard, params.s.lastMove)

for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    let cx = renorm(x, 0, COLS, -1 + SPACING_X / 2, 1 + SPACING_X / 2)
    let cy = renorm(y, 0, ROWS, -1 + SPACING_Y / 2, 1 + SPACING_Y / 2)
    let index = y * COLS + x
    let state = goBoard[x][y]
    switch (state) {
      case undefined:
        begin()
        line(cx - SPACING_X / 2, cy)
        line(cx + SPACING_X / 2, cy)
        begin()
        line(cx, cy - SPACING_Y / 2)
        line(cx, cy + SPACING_Y / 2)
        break
      case true:
        begin(true)
        circle(cx, cy, RADIUS)
        break
      case false:
        begin()
        circle(cx, cy, RADIUS)
        break
    }
  }
}
