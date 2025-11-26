import { SAMPLE_RATE_RECIP } from './constants';
import { Signal } from './signal';

export function ad(a: Signal, d: Signal) {
  let stage: 'off' | 'a' | 'd' = 'off';
  let value = 0;
  return Signal.new({
    nextSample() {
      switch (stage) {
        case 'off':
          return 0;
        case 'a':
          value = a.value > 0 ? Math.min(value + SAMPLE_RATE_RECIP / a.value, 1) : 1;
          if (value === 1) {
            stage = 'd';
          }
          return value;
        case 'd':
          value = d.value > 0 ? Math.max(value - SAMPLE_RATE_RECIP / d.value, 0) : 0;
          if (value === 0) {
            stage = 'off';
          }
          return value;
      }
    },

    initialValue: 0,

    noteOn() {
      stage = 'a';
      // note: don't set the value to zero, otherwise we get clicks
      // when the env is triggered halfway through the previous time
    },
  });
}

export function adsr(a: Signal, d: Signal, s: Signal, r: Signal) {
  let stage: 'off' | 'a' | 'd' | 's' | 'r' = 'off';
  let value = 0;
  return Signal.new({
    nextSample() {
      switch (stage) {
        case 'off':
          return 0;
        case 'a':
          value = a.value > 0 ? Math.min(value + SAMPLE_RATE_RECIP / a.value, 1) : 1;
          if (value === 1) {
            stage = 'd';
          }
          return value;
        case 'd':
          value = d.value > 0 ? Math.max(value - SAMPLE_RATE_RECIP / d.value, s.value) : s.value;
          if (value === s.value) {
            stage = 's';
          }
          return value;
        case 's':
          return value;
        case 'r':
          value = r.value > 0 ? Math.max(value - SAMPLE_RATE_RECIP / r.value, 0) : 0;
          if (value === 0) {
            stage = 'off';
          }
          return value;
      }
    },

    initialValue: 0,

    noteOn() {
      stage = 'a';
      // note: don't set the value to zero, otherwise we get clicks
      // when the env is triggered halfway through the previous time
    },

    noteOff() {
      stage = 'r';
    },
  });
}
