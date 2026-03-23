// double you double vee
// by grjte

let t = params.t
let abs_t = abs(cosn(t/2))

let top = -0.75
let bottom = -top*abs_t
let middle_top = top*(1-abs_t)
let left = -0.5*abs_t
let right = -left

move(left, top)
line(left, bottom)

move(left, bottom)
line(0, middle_top)
move(0, middle_top)
line(right, bottom)

move(right, top)
line(right, bottom)

circle()
rect()