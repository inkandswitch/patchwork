// author: june
// divining shapes
// grab 't' to freeze
// the handle toggles calmness

// adjust size
scalen(1.3)

// remember randomness
const rand = (from, to) => {
  // remember calmness
  if(params.q > 0.25) {
    return 0
  }
  return from + ((params.t = (params.t*1664525 + 1013904223) >>> 0) / 2**32) * (to - from + 1);
}

// remember grids
let grid = [
  ".--------.",
  "!********!",
  "! *INK** !",
  "!   &*   !",
  "!   *&   !",
  "!   &*   !",
  "!   *&   !",
  "!   &*   !",
  "! SWITCH !",
  "!********!",
  "\'--------\'"
]

// remember floating point
let offsets = [-0.76, -0.7]
let size = 0.15

// remember ink & switch
let switchy = "_!&SWITCH"

// remember objects
let shapes = {
  // remember language
  '*': (x, y) => text(switchy[floor(rand(0, switchy.length - 1))], x, y, size),
}

// remember loops
for (let row = 0; row < grid.length; row++) {
  for (let column = 0; column < grid[row].length; column++) {
    let x = (column * size) + offsets[1]
    let y = (row * size) + offsets[0]
    if(grid[row][column] in shapes) {
      shapes[grid[row][column]](x, y)
    } else {
      text(grid[row][column], x, y, size)
    }
  }
}