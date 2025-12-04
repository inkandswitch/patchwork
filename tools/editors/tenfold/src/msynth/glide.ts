import { SAMPLE_RATE, SAMPLE_RATE_RECIP } from './constants';
import { Signal } from './signal';

/** glide linearly (t is time for the signal to move 1 unit) */
export function linear(input: Signal, t: Signal) {
  let lastValue = input.value;
  return Signal.new(() => {
    if (t.value === 0) {
      lastValue = input.value;
    } else {
      const epsilon = SAMPLE_RATE_RECIP / t.value;
      const diff = input.value - lastValue;
      if (diff > epsilon) {
        lastValue += epsilon;
      } else if (diff < -epsilon) {
        lastValue -= epsilon;
      } else {
        lastValue = input.value;
      }
    }
    return lastValue;
  });
}

/** glide exponentially (t is time for the signal to move 1 octave) */
export function exponential(input: Signal, t: Signal, legato: boolean) {
  let lastValue = input.value;
  let jumping = false;
  return Signal.new({
    nextSample() {
      if (t.value === 0) {
        lastValue = input.value;
      } else if (jumping) {
        lastValue = input.value;
        jumping = false;
      } else {
        const m = Math.pow(2, 1 / (t.value * SAMPLE_RATE));
        if (lastValue < input.value) {
          lastValue = Math.min(lastValue * m, input.value);
        } else if (lastValue > input.value) {
          lastValue = Math.max(lastValue / m, input.value);
        }
      }
      return lastValue;
    },

    initialValue: lastValue,

    noteOn(voice, retriggered) {
      if (legato && !retriggered && voice.noteNums.length === 1) {
        jumping = true;
      }
    },
  });
}
