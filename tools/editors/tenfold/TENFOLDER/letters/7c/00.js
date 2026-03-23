// this is Dan's tweak of peter's C02

const { i, q, r, t, x, y } = params

const arcstart = 0.05
const arclength = 0.4 // sinn(params.t * 2) / 50
const wiggle = sinn(params.t) / 60
const chomp = cosn(t)

const count = 20
for (let i = 0; i < count; i++) {
  const gap = i / count / 2
  arc(wiggle + gap / 44, wiggle - gap / 4, 0.65, arcstart + gap + 0.04 * chomp, arcstart + arclength + gap - 0.04 * chomp)
}

const cx = 0.1
const cy = -0.2
