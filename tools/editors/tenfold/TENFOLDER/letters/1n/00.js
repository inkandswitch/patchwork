// N'S RESERVED FOR CHEE AND MIMI
// 🐢
// - rabbit out of time
// red alert! read the tea leaves.
// <WORM?.WORM!.RADIO?.REMIX!>

// A turtle walks from point to point, leaving a trail of circles.
let x = 0
let y = 0
let d = 0
let t = 1

// The circles can be spaced closer together
// or, yes you guessed it, further apart.
let space = (2 ** (params.y+1)) * 4

// The circles can be smaller or bigger overall
let r = declip(params.x, 0, .2)

// The circles get bigger and smaller in waves
// as the turtle walks, controlled by the waffle.
let waveFrequency = declip(params.r, .005, .02)
let waveAmplitude = declip(params.q, 0, .1)

// Walk the turtle!
function forward(n) {
  while (n>0) {

    let radius = r + sinn(n * waveFrequency) * waveAmplitude

    if (n % space < 1) {

      // Animate the position
      let phase = params.t + n / 100
      let X = x + sinn(phase) / 30
      let Y = y + cosn(phase) / 30

      // Draw a circle at the turtle
      circle(X, Y, radius)
    }
    
    x += sinn(t)/100
    y += cosn(t)/100
    n--
  }
}

function right(n) {
  t -= n
}

function left(n) {
  t += n
}


function setx(n) {
  x = n
}

function sety(n) {
  y = n
}

setx(-.75)
sety(.9)
left(.5)
forward(180)
right(.39)
forward(235)
left(.39)
forward(180)