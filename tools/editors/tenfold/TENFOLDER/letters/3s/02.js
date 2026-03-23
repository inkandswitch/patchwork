// s02
// by chee and mimi

// make everything bigger
scalen(1.2)

// we're gonna spin around in a spiral
// and the inner tip of the spiral
// will slide back and forth

// slide the inner tip back and forth
let inner = 0.1618 * sinn(params.t / 2)
let outer = 0.3

// top spiral
for (let turns = 0.35; turns < 1.935; turns += 0.01618) {
  // move outward (from inner to outer) as we spin
  let dist = denorm(turns, inner, outer)
  let x = cosn(turns) * dist
  let y = sinn(turns) * dist
  // circles grow and shrink over time
  let r = 0.04 * sinn(turns * norm(sinn(params.t) + 0.2) * dist)
  circle(x, y - 0.25, r)
}

// bottom spiral
for (let turns = 0.35; turns < 1.935; turns += 0.01618) {
  let dist = denorm(turns, inner, outer)
  let x = -cosn(turns) * dist
  let y = -sinn(turns) * dist
  let r = 0.04 * sinn(turns * norm(sinn(params.t) + 0.2) * dist)
  circle(x, y + 0.25, r)
}
