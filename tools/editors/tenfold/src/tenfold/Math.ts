export const TAU = Math.PI * 2

// keep i between min and max
export const clip = (i: number, min = 0, max = 1) => Math.min(Math.max(i, min), max)

// get what i would be if min became 0 and max became 1
export const normalized = (i: number, min: number, max: number, doClip = false) => {
  let n = max === min ? min : (i - min) / (max - min)
  return doClip ? clip(n) : n
}

// get what i would be if 0 became min and 1 became max
export const denormalized = (i: number, min: number, max: number) => i * (max - min) + min

// normalize to [min1,max1] then denormalize to [min2,max2]
export const renormalized = (i: number, min1: number, max1: number, min2: number, max2: number, doClip = false) => {
  if (max1 < min1) [min1, max1] = [max1, min1]
  let n = normalized(i, min1, max1, doClip)
  return denormalized(n, min2, max2)
}

// This does the same thing as denormalized, but with better numerical stability and a different argument order.
// It's worth including both for now because they serve different purposes.
export const lerp = (a: number, b: number, x: number) => (1 - x) * a + b * x

// Framerate independent lerp — https://blog.pkh.me/p/41-fixing-the-iterative-damping-interpolation-in-video-games.html
// TODO: this signature sucks
export const interp = (a: number, b: number, dt: number, rate: number, fps: number) => {
  const rate2 = -fps * Math.log(1 - rate / fps)
  return lerp(a, b, 1.0 - Math.exp(-dt * rate2))
}

// Simple s-curve easing function
export const sCurve = (i: number, iMin = 0, iMax = 1, oMin = 0, oMax = 1) => {
  i = clip(normalized(i, iMin, iMax))
  i = 3 * Math.pow(i, 2) - 2 * Math.pow(i, 3)
  return denormalized(i, oMin, oMax)
}

// random float in the range [min,max)
export const rand = (min = 0, max = 1) => denormalized(Math.random(), min, max)

// random int in the range [min,max]
export const randInt = (min = 0, max = 1) => Math.floor(rand(min, max + 1)) // (written carefully to avoid bias)

// like %, but without mirroring at 0
export const mod = (n: number, m = 1) => ((n % m) + m) % m

export const equal = (a: number, b: number, tolerance = 1e-10) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b))

export const isZero = (v: number) => Number.EPSILON > Math.abs(v)

export const isNonZero = (v: number) => !isZero(v)

export const isNorm = (v: number) => v >= 0 && v <= 1

export const avg = (a: number, b: number) => (a + b) / 2

export const roundTo = (input: number, precision: number) => {
  // Using the reciprocal avoids floating point errors. Eg: 3/10 is fine, but 3*0.1 is wrong.
  const p = 1 / precision
  return Math.round(input * p) / p
}

// Alias, because it's sometimes weird to think of one in terms of the other
export const nearestMultiple = roundTo

export const easeInOut = (t: number) => (t < 0.5 ? denormalized((t * 2) ** 3, 0, 0.5) : renormalized(((1 - t) * 2) ** 3, 1, 0, 0.5, 1))

// Returns the equivalent angle in the range [0, 2pi)
export const normalizeAngle = (angle: number) => mod(angle, TAU)
