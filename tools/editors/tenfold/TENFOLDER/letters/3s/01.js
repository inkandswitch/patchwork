// Bouncy S
// by Paul

for (let i = 0; i < 4; i++) {
  text("S", params.x, params.y, declip(sin((params.t + i / 200) * 100), 1.75, 2.25))
}

