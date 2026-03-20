// This Cool S is by Mimi and every high school student since 1980

let th = -0.5
let c = 0
let tb = -0.2
let spacing = 0.4

// not sure who made this but this is a clever way to do timelines!
// - orion r
const steps = [
  () => {
    move(-spacing, th)
    line(-spacing, tb)
  },
  () => {
    move(c, th)
    line(c, tb)
  },
  () => {
    move(spacing, th)
    line(spacing, tb)
  },

  () => {
    move(-spacing, -th)
    line(-spacing, -tb)
  },
  () => {
    move(c, -th)
    line(c, -tb)
  },
  () => {
    move(spacing, -th)
    line(spacing, -tb)
  },

  () => {
    move(-spacing, (th - tb) / 1.5)
    line(c, (tb - th) / 1.5)
  },
  () => {
    move(0, (th - tb) / 1.5)
    line(spacing, (tb - th) / 1.5)
  },
  () => {
    move(0, th + (th + tb) / 2)
    line(spacing, th)
  },
  () => {
    move(0, th + (th + tb) / 2)
    line(-spacing, th)
  },
  () => {
    move(0, -th - (th + tb) / 2)
    line(spacing, -th)
  },
  () => {
    move(0, -th - (th + tb) / 2)
    line(-spacing, -th)
  },
  () => {
    move(spacing, (th - tb) / 1.5)
    line(c + spacing / 2, (tb - th) / 64)
  },
  () => {
    move(-spacing, -(th - tb) / 1.5)
    line(-(c + spacing / 2), (tb - th) / 64)
  },
]

let s = denorm(params.t * 2, 0, steps.length + 1)

for (const step of steps.slice(0, s)) {
  rotaten(denorm(sinn(params.t), 0.0001, 0.0007))
  step()
}
