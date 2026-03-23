// bouncing ball
// by two foxers

// triangle wave, phased like a cosn
let ctri = (v) => clip(abs(mod(v*2,2) - 1))

// triangle wave, phased like a sinn
let stri = (v) => clip(abs(mod(v*2-.5,2) - 1))

begin(true)

let ball = (x=0, y=0, r=.1) => {
  circle(x, y, r)
}

let bounce = (t, f)=> {
  
  let y = clip(abs(sinn(t)) ** 5)
  
  ball(clip(mod(t)), y, denorm(f ** .2, .1, 0))
}

// determines spacing of echoes
let quality = 1024

// how long, at most, the trail of echoes is
// in terms of `t`
let maxTail = .9

// how many echoes to draw, 0 to quality
let steps = quality * (1 - norm(sinn(params.t)))

// how many loops should the ball make per full cycle of `t`
let nloops = 4

for (let i = 0; i < steps; i++) {
  // which echo is this (normalized)
  let f = i / quality

  // shift `t` for this echo
  let localT = params.t * nloops - (maxTail * f)
  
  // draw the echo
  bounce(localT, f)
}