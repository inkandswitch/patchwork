import { Signal, scalar } from "./signal.ts"
import * as env from "./env.ts"
import * as glide from "./glide.ts"
import * as effects from "./effects.ts"
import { ladder } from "./ladder.ts"
import { SAMPLE_RATE_RECIP, TAU } from "./constants.ts"

// TODO: functions here should do arity checking
// i.e., they should throw an error if they received too few or too many args
// This prob. means that they should take an Ohm interval as their 1st arg.

export const msynthLib: Record<string, Function> = {
  // ----- oscillators -----

  sine: (f = scalar(440)) => {
    let phase = 0
    return Signal.new(() => {
      const sample = Math.sin(phase * TAU)
      const phaseInc = f.value * SAMPLE_RATE_RECIP
      phase += phaseInc
      phase -= Math.floor(phase)
      return sample
    })
  },

  saw(f = scalar(440)) {
    let phase = 0
    return Signal.new(() => {
      const naiveSample = 2 * phase - 1
      const phaseInc = f.value * SAMPLE_RATE_RECIP
      const sample = naiveSample - polyBlep(phase, phaseInc)
      phase += phaseInc
      phase -= Math.floor(phase)
      return sample
    })
  },

  pwm: (f = scalar(440), m = scalar(0.5), sync: Signal | null = null) => {
    let phase = 0
    let prevSyncValue = 0
    return Signal.new(() => {
      const naiveSample = phase < m.value ? -1 : 1
      const phaseInc = f.value * SAMPLE_RATE_RECIP
      const sample = naiveSample - polyBlep(phase, phaseInc) + polyBlep((phase - m.value + 1) % 1, phaseInc)

      const currSyncValue = sync?.value ?? 0
      let syncDetected = false
      if (prevSyncValue < 0 && currSyncValue >= 0) {
        const currSyncValue = sync?.value ?? 0
        if (prevSyncValue < 0 && currSyncValue >= 0) {
          // estimate zero crossing between previous and current value
          // prev + (curr - prev) * r = 0  =>  r = -prev / (curr - prev)
          const r = -prevSyncValue / (currSyncValue - prevSyncValue)
          // time since crossing to current sample = (1 - r) * dt
          phase = Math.floor((1 - r) * phaseInc)
          syncDetected = true
        }
      }
      prevSyncValue = currSyncValue

      if (!syncDetected) {
        phase += phaseInc
        phase -= Math.floor(phase)
      }
      return sample
    })
  },

  // ----- glides -----

  /** glide linearly (t is time for the signal to move 1 unit) */
  lglide: (s: Signal, t = scalar(0.1)) => glide.linear(s, t),

  /** glide exponentially (t is time for the signal to move 1 octave, in seconds) */
  eglide: (s: Signal, t = scalar(1)) => glide.exponential(s, t, false),

  legato: (s: Signal, t = scalar(1)) => glide.exponential(s, t, true),

  // ----- envelopes -----
  ad: env.ad,
  adsr: env.adsr,

  // ----- filters -----
  lpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("lp24", s, cf, q),
  lpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("lp12", s, cf, q),
  lpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("lp24", s, cf, q),
  hpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("hp24", s, cf, q),
  hpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("hp12", s, cf, q),
  hpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("hp24", s, cf, q),
  bpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("bp24", s, cf, q),
  bpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("bp12", s, cf, q),
  bpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder("bp24", s, cf, q),

  // ----- effects -----
  delay: effects.delay,

  // ----- other helpers -----
  latch: (s: Signal, useLastValue: Signal) => {
    let lastValue = 0
    return Signal.new(() => {
      if (useLastValue.value === 0) {
        lastValue = s.value
      }
      return lastValue
    })
  },

  // DC blocking filter: high-pass at ~35Hz to remove DC while preserving audible content
  // Uses a one-pole high-pass: y[n] = x[n] - x[n-1] + α * y[n-1]
  dcBlock: (s: Signal) => {
    // α = 0.995 gives ~35Hz cutoff at 48kHz
    const alpha = 0.995
    let prevX = 0
    let prevY = 0
    return Signal.new(() => {
      const x = s.value
      const y = x - prevX + alpha * prevY
      prevX = x
      prevY = y
      return y
    })
  },
}

// https://mitxela.com/projects/bleps_via_state_machine
function polyBlep(t: number, dt: number) {
  // 0 <= t < 1
  if (t < dt) {
    t /= dt
    // 2 * (t - t^2/2 - 0.5)
    return t + t - t * t - 1
  }

  // -1 < t < 0
  if (t > 1 - dt) {
    t = (t - 1) / dt
    // 2 * (t^2/2 + t + 0.5)
    return t * t + t + t + 1
  }

  // 0 otherwise
  return 0
}
