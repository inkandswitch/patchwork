// "THIS S HAS BEEN RESERVED FOR MIMI AND CHEE"
// by Mimi & chee

for (let turns = 0.35; turns < 1.935; turns += 0.01618) {
  let dist = denorm(turns, 0.1618 * sinn(params.t / 2), 0.3)
  let x = cosn(turns) * dist
  let y = sinn(turns) * dist
  circle(x, y - 0.3, 0.002 * sinn(turns * norm(sinn(params.t) + 0.2) * dist) * 20)
}

for (let turns = 0.35; turns < 1.935; turns += 0.01618) {
  let dist = denorm(turns, 0.1618 * sinn(params.t / 2), 0.3)
  let x = -cosn(turns) * dist
  let y = -sinn(turns) * dist
  circle(x, y + 0.2, 0.002 * sinn(turns * norm(sinn(params.t) + 0.2) * dist) * 20)
}
