import { Signal, scalar } from './signal';
import * as env from './env';
import * as glide from './glide';
import * as effects from './effects';
import { ladder } from './ladder';
import { SAMPLE_RATE_RECIP, TAU } from './constants';

// TODO: functions here should do arity checking
// i.e., they should throw an error if they received too few or too many args
// This prob. means that they should take an Ohm interval as their 1st arg.

export const msynthLib: Record<string, Function> = {
  // ----- oscillators -----

  sine: (f = scalar(440)) => {
    let phase = 0;
    return Signal.new(() => {
      const sample = Math.sin(phase * TAU);
      phase += f.value * SAMPLE_RATE_RECIP;
      phase -= Math.floor(phase);
      return sample;
    });
  },

  saw(f = scalar(440)) {
    let phase = 0;
    return Signal.new(() => {
      const sample = phase * 2 - 1;
      phase += f.value * SAMPLE_RATE_RECIP;
      phase -= Math.floor(phase);
      return sample;
    });
  },

  pwm: (f = scalar(440), m = scalar(0.5)) => {
    let phase = 0;
    return Signal.new(() => {
      const sample = phase < m.value ? -1 : 1;
      phase += f.value * SAMPLE_RATE_RECIP;
      phase -= Math.floor(phase);
      return sample;
    });
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
  lpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('lp24', s, cf, q),
  lpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('lp12', s, cf, q),
  lpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('lp24', s, cf, q),
  hpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('hp24', s, cf, q),
  hpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('hp12', s, cf, q),
  hpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('hp24', s, cf, q),
  bpf: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('bp24', s, cf, q),
  bpf12: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('bp12', s, cf, q),
  bpf24: (s: Signal, cf: Signal, q = scalar(0.2)) => ladder('bp24', s, cf, q),

  // ----- effects -----
  delay: effects.delay,

  // ----- other helpers -----
  latch: (s: Signal, useLastValue: Signal) => {
    let lastValue = 0;
    return Signal.new(() => {
      if (useLastValue.value === 0) {
        lastValue = s.value;
      }
      return lastValue;
    });
  },
};
