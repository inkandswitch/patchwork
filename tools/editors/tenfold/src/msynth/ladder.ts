// Ported from Daisy's ladder filter
// https://github.com/electro-smith/DaisySP/blob/master/Source/Filters/ladder.h
// https://github.com/electro-smith/DaisySP/blob/master/Source/Filters/ladder.cpp

import { SAMPLE_RATE, TAU } from './constants';
import { Signal } from './signal';
import { clamp, fastTanh } from './helpers';

const INTERPOLATION = 4;
const INTERPOLATION_RECIP = 1.0 / INTERPOLATION;
const SAMPLE_RATE_INTERPOLATION_RECIP = 1 / (SAMPLE_RATE * INTERPOLATION);
const RESONANCE_MULTIPLIER = 1.8; // to go from our range of 0 ... 1 to theirs of 0 ... 1.8
const MIN_CUTOFF_FREQ = 5;
const MAX_CUTOFF_FREQ = SAMPLE_RATE * 0.425;
const INPUT_THRESHOLD = 1e-5; // threshold below which we consider input to be zero
const STATE_DECAY = 0.95; // decay filter state when input is zero

export function ladder(
  mode: 'lp24' | 'lp12' | 'bp24' | 'bp12' | 'hp24' | 'hp12',
  _input: Signal,
  _cutoffFreq: Signal,
  _q: Signal,
) {
  let z0 = [0, 0, 0, 0];
  let z1 = [0, 0, 0, 0];
  let alpha = 1;
  let k = 1;
  let qAdjust = 1;
  let pbg = 0; // 0 ... 0.5
  let drive = 1;
  let driveScaled = 1;
  let oldInput = 0;

  function updateFreq() {
    // recompute the coefficients
    const wc =
      clamp(_cutoffFreq.value, MIN_CUTOFF_FREQ, MAX_CUTOFF_FREQ) *
      TAU *
      SAMPLE_RATE_INTERPOLATION_RECIP;
    const wc2 = wc * wc;
    const wc3 = wc * wc2;
    const wc4 = wc * wc3;
    alpha = 0.9892 * wc - 0.4324 * wc2 + 0.1381 * wc3 - 0.0202 * wc4;
    qAdjust = 1.006 + 0.0536 * wc - 0.095 * wc2 - 0.05 * wc4;
  }

  function updateResonance() {
    k = 4 * clamp(_q.value, 0, 1) * RESONANCE_MULTIPLIER;
  }

  // valid range: [0, 4]
  function setInputDrive(odrv: number) {
    drive = Math.max(odrv, 0);
    if (drive > 1) {
      drive = Math.min(drive, 4);
      // max is 4 when pbg = 0, and 2.5 when pbg is 0.5
      driveScaled = 1 + (drive - 1) * (1 - pbg);
    } else {
      driveScaled = drive;
    }
  }

  function setPassbandGain(value: number) {
    pbg = clamp(value, 0, 0.5);
    setInputDrive(drive);
  }

  function lpf(s: number, idx: number) {
    //           (1.0 / 1.3)  (0.3 / 1.3)
    let ft = s * 0.76923077 + 0.23076923 * z0[idx] - z1[idx];
    ft = ft * alpha + z1[idx];
    z1[idx] = ft;
    z0[idx] = s;
    return ft;
  }

  // Weighted filter stage mixing to achieve selected response
  // as described in "Oscillator and Filter Algorithms for Virtual Analog Synthesis"
  // Välimäki and Huovilainen, Computer Music Journal, vol 60, 2006
  function weightedSumForCurrentMode(
    stageOuts0: number,
    stageOuts1: number,
    stageOuts2: number,
    stageOuts3: number,
    stageOuts4: number,
  ) {
    switch (mode) {
      case 'lp24':
        return stageOuts4;
      case 'lp12':
        return stageOuts2;
      case 'bp24':
        return (stageOuts2 + stageOuts4) * 4 - stageOuts3 * 8;
      case 'bp12':
        return (stageOuts1 - stageOuts2) * 2;
      case 'hp24':
        return stageOuts0 + stageOuts4 - (stageOuts1 + stageOuts3) * 4 + stageOuts2 * 6;
      case 'hp12':
        return stageOuts0 + stageOuts2 - stageOuts1 * 2;
      default:
        return 0;
    }
  }

  // initialization
  // (no need to init freq and resonance b/c those are dealt with for every sample)
  setInputDrive(1);
  setPassbandGain(0.5);

  return Signal.new(() => {
    updateFreq();
    updateResonance();

    let input = _input.value * driveScaled;
    const inputAbs = Math.abs(input);

    // If input is effectively zero, decay the filter state to prevent ringing
    if (inputAbs < INPUT_THRESHOLD) {
      for (let i = 0; i < 4; i++) {
        z0[i] *= STATE_DECAY;
        z1[i] *= STATE_DECAY;
      }
      oldInput *= STATE_DECAY;
    }

    let total = 0;
    let interp = 0;
    for (let os = 0; os < INTERPOLATION; os++) {
      const inInterp = interp * oldInput + (1 - interp) * input;
      const u = fastTanh(inInterp - (z1[3] - pbg * inInterp) * k * qAdjust);
      const stage1 = lpf(u, 0);
      const stage2 = lpf(stage1, 1);
      const stage3 = lpf(stage2, 2);
      const stage4 = lpf(stage3, 3);
      total += weightedSumForCurrentMode(u, stage1, stage2, stage3, stage4) * INTERPOLATION_RECIP;
      interp += INTERPOLATION_RECIP;
    }
    oldInput = input;
    return total;
  });
}
