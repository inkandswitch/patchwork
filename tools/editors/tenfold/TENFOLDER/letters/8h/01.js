// tHe thinker
// by grjte

let { q, r, t } = params

scalen(1.3)
translate(0, .17)

// rotation with the waffle
let angleY = q * 0.5 + 0.43 // left/right rotation

// Isometric projection
function iso(x3, y3, z3) {
  // Rotate around y-axis
  let rx = x3 * cosn(angleY) - z3 * sinn(angleY)
  let rz = x3 * sinn(angleY) + z3 * cosn(angleY)

  return {
    x: (rx - rz) * 0.7,
    y: (rx + rz) * 0.4 + y3
  }
}

// --- chair
let s = 0.3 // half-size of seat
let seatY = params.y / 5

let seat = [
  iso(-s, seatY, -s),
  iso(+s, seatY, -s),
  iso(+s, seatY, +s),
  iso(-s, seatY, +s),
]

// Draw seat
begin()
for (let c of seat) line(c.x, c.y)
line(seat[0].x, seat[0].y)

// Back rectangle
let backTop = -0.75
let backBottom = seatY

let back = [
  iso(-s, backBottom, -s),
  iso(-s, backBottom, s),
  iso(-s, backTop, s),
  iso(-s, backTop, -s),
]

// Draw back
begin()
for (let c of back) line(c.x, c.y)
line(back[0].x, back[0].y)

// Four legs
let legBottom = 0.5

let legs = [
  [iso(-s, seatY, -s), iso(-s, legBottom, -s)],
  [iso(+s, seatY, -s), iso(+s, legBottom, -s)],
  [iso(+s, seatY, +s), iso(+s, legBottom, +s)],
  [iso(-s, seatY, +s), iso(-s, legBottom, +s)],
]

for (let leg of legs) {
  begin()
  line(leg[0].x, leg[0].y)
  line(leg[1].x, leg[1].y)
}

// --- person

// Torso
let hip = iso(0, seatY, 0)
let shoulder = iso(0.1, -0.3, 0)

begin()
line(hip.x, hip.y)
line(shoulder.x, shoulder.y)

// Head
let head = iso(0.2, -0.42, -0.05)
circle(head.x, head.y, 0.08)

// Left arm
let leftElbow = iso(0.15, -0.15, -0.15)
let leftHand = iso(s - 0.05, seatY, -0.12)
begin()
line(shoulder.x, shoulder.y)
line(leftElbow.x, leftElbow.y)
line(leftHand.x, leftHand.y)

// Right arm
let rightElbow = iso(s - 0.05, seatY - 0.05, 0.12)
let rightHand = iso(0.2, -0.35, -0.02) // under chin
begin()
line(shoulder.x, shoulder.y)
line(rightElbow.x, rightElbow.y)
line(rightHand.x, rightHand.y)

// Legs
let footBottom = legBottom * 0.75
let leftKnee = iso(s, seatY, -0.12)
let leftFoot = iso(s, footBottom, -0.12)
let leftToe = iso(s + 0.12, footBottom, -0.12)
let rightKnee = iso(s, seatY, 0.12)
let rightFoot = iso(s, footBottom, 0.12)
let rightToe = iso(s + 0.12, footBottom, 0.12)

// Left leg
begin()
move(hip.x, hip.y)
line(leftKnee.x, leftKnee.y)
line(leftFoot.x, leftFoot.y)
line(leftToe.x, leftToe.y)

// Right leg
begin()
line(hip.x, hip.y)
line(rightKnee.x, rightKnee.y)
line(rightFoot.x, rightFoot.y)
line(rightToe.x, rightToe.y)