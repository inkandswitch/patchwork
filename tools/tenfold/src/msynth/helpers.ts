export function toFrequency(midiNote: number) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function interpolatedRead(xs: Float32Array, idx: number) {
  const whole = Math.floor(idx);
  const frac = idx - whole;
  let wholePlus1 = whole + 1;
  if (wholePlus1 === xs.length) {
    wholePlus1 = 0;
  }
  return (1 - frac) * xs[whole] + frac * xs[wholePlus1];
}

export function fastTanh(x: number) {
  if (x > 3) {
    return 1;
  } else if (x < -3) {
    return -1;
  } else {
    const x2 = x * x;
    return (x * (27 + x2)) / (27 + 9 * x2);
  }
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

export function makeSharedFloat32Array(length: number): Float32Array<any> {
  return new Float32Array(new SharedArrayBuffer(length * 4));
}
