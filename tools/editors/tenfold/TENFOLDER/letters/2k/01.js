// K1.1
// by paul y ivan

const STEP_X = 0.13
const STEP_Y = 0.09

const OFFSET_X = -0.7
const OFFSET_Y = 0

const TOP_Y = -1
const BOTTOM_Y = .9
const LEFT_X = -.4
const RIGHT_X = .4

const K_NESS = 2 + params.x // higher more like a K

let x = LEFT_X
let i = 0

while (x < RIGHT_X) {
  begin()

  let j = 0
  let y = TOP_Y

  while (y < BOTTOM_Y) {
    y += STEP_Y
    j += 1

    const rand = mod(sin(params.t * y * i * 5 / params.r) * 5 / params.q)
    let variance = rand * K_NESS * abs(y)
    variance *= x - LEFT_X

    line(x + variance + OFFSET_X, y + OFFSET_Y)
  }

  x += STEP_X
  i += 1
}
