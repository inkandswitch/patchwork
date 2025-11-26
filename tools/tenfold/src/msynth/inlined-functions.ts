// Stuff in here used to be in the standard library of signals -- see msynth-lib.ts
// But inlining them makes things more efficient b/c we don't have to pay for the
// overhead of lots of intermediate signals. (It matters for complex patches!)

export const inlinedFunctions: Record<string, Function> = {
  // ----- math stuff -----
  'unary-': (x: string) => `(-${x})`,
  '+': (x: string, y: string) => `(${x} + ${y})`,
  '-': (x: string, y: string) => `(${x} - ${y})`,
  '*': (x: string, y: string) => `(${x} * ${y})`,
  '/': (x: string, y: string) => `(${x} / ifZero(${y}, 0.00001))`,
  '%': (x: string, y: string) => `(${x} % ifZero(${y}, 0.00001))`,
  clamp: (x: string, min: string, max: string) => `Math.min(Math.max(${x}, ${min}), ${max})`,
  min: (x: string, y: string) => `Math.min(${x}, ${y})`,
  max: (x: string, y: string) => `Math.max(${x}, ${y})`,
  round: (x: string) => `Math.round(${x})`,
  abs: (x: string) => `Math.abs(${x})`,

  // ----- scaling -----

  /** [min, max] -> [0, 1], linearly */
  normalize: (value: string, min = '-1', max = '1') =>
    `((value, min, max) => max <= min ? 0 : (value - min) / (max - min))(${value}, ${min}, ${max})`,

  /** [0, 1] -> [min, max], linearly */
  lscale: (value: string, min: string, max: string) =>
    `((value, min, max) => value * (max - min) + min)(${value}, ${min}, ${max})`,

  /** [0, 1] -> [min, max], exponentially */
  escale: (s: string, min: string, max: string) =>
    `((value, min, max) => {
      if (min === 0) {
        min = 0.001;
      }
      return min * Math.pow(max / min, value);
    })(${s}, ${min}, ${max})`,

  // ----- frequency helpers -----
  semitones: (n: string) => `Math.pow(2, ${n} / 12)`,
  quantizeFreq: (f: string, b = '440') =>
    `((f, b) => (b * Math.pow(2, Math.round(12 * Math.log2(f / b)) / 12)))(${f}, ${b})`,

  // ----- conditionals -----
  ifPos: (s: string, t: string, f: string) => `(${s} >= 0 ? ${t} : ${f})`,
  switch: (s: string, neg: string, zero: string, pos: string) =>
    `((s, neg, zero, pos) => s === 0 ? zero : s < 0 ? neg : pos)(${s}, ${neg}, ${zero}, ${pos})`,
};
