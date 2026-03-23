// The I's Have It
// by Ivan

// Our trusty loop counter.
let I = 0

// How dense should the drawing be?
// We will use the Waffle to decide.
let steps = declip(params.q, 20, .5)

// How big should the lil I's be?
// Drag the letter to decide.
let size = declip(params.y, .1, .7)

// Animate the size slightly
size += declip(sinn(params.t), -.1, .1)

// Shrink Dust by Chad VanGaalen
scalen(.8)

// Loop across the top
for (I = -1; I <= 1; I += 1/steps) text("I", I, -1, size)

// and down the middle
// (shh - H is just a rotated I it's fine)
for (I = -1; I <= 1; I += 1/steps) text("H", 0, I, size)

// and across the bottom
for (I = -1; I <= 1; I += 1/steps) text("I", I, 1, size)