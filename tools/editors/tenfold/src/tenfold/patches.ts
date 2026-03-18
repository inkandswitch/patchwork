export const patches = {
  // Drawing-reactive patches that respond to collector metrics via params 1-10
  // param1: centerY (-1 to 1), param2: centerX (-1 to 1), param3: pathLength (0-1)
  // param4: curvature (0-1), param5: density (0-1), param6: discontinuity (0-1)
  // param7: directionEntropy (0-1), param8: spreadX (0-1), param9: spreadY (0-1)
  // param10: circleRatio (0-1)

  reactiveVoice: `
    // Smooth all params to avoid zipper noise
    cy = param1 lglide(0.08)
    cx = param2 lglide(0.08)
    ink = param3 lglide(0.05)
    curv = param4 lglide(0.1)
    dens = param5 lglide(0.1)
    disc = param6 lglide(0.1)
    entropy = param7 lglide(0.1)
    spX = param8 lglide(0.1)
    circRatio = param10 lglide(0.1)

    // Pitch: centerY shifts ±12 semitones
    pitchMult = semitones(cy * 12)
    freq = noteFreq * pitchMult

    // Detune: spreadX controls stereo width
    detune = spX lscale(0, 0.015)

    // Oscillator mix: circleRatio blends sine<->saw
    osc1 = (freq * (1 - detune)) saw
    osc2 = (freq * (1 + detune)) sine
    mix = osc1 * (1 - circRatio) + osc2 * circRatio

    // Filter: curvature inverts to cutoff (curvy = dark)
    cutoff = (1 - curv) escale(300, 6000)
    reso = dens lscale(0.1, 0.7)
    filtered = mix lpf(cutoff, reso)

    // Amplitude envelope: discontinuity -> attack
    atk = (1 - disc) escale(0.005, 0.3)
    env = adsr(atk, 0.1, 0.8, 0.4)

    // Modulation: entropy drives vibrato depth
    vibrato = 6 sine * entropy lscale(0, 0.02)

    out = filtered * env * ink lscale(0.2, 1) * (1 + vibrato)
  `,

  drawingDrone: `
    cy = param1 lglide(0.2)
    curv = param4 lglide(0.2)
    entropy = param7 lglide(0.2)
    spX = param8 lglide(0.2)
    spY = param9 lglide(0.2)

    // Very slow pitch drift based on centerY
    freq = noteFreq * (1 + cy * 0.1)

    // Multiple detuned oscillators
    spread = (spX + spY) / 2
    d1 = spread lscale(0.001, 0.008)
    d2 = spread lscale(0.002, 0.012)

    oscs = (
      (freq * (1 - d1)) pwm(0.3) +
      (freq * (1 + d1)) pwm(0.5) +
      (freq * (1 - d2)) pwm(0.7) +
      (freq * (1 + d2)) pwm(0.4)
    ) / 4

    // Filter modulated by entropy
    lfoRate = entropy lscale(0.1, 2)
    lfo = lfoRate sine normalize
    cutoff = (curv * 0.5 + lfo * 0.3) escale(200, 4000)

    filtered = oscs lpf12(cutoff, 0.4)
    out = filtered * adsr(0.5, 0.2, 0.9, 2) * 0.6
  `,

  percussiveInk: `
    ink = param3 lglide(0.02)
    disc = param6 lglide(0.02)
    dens = param5 lglide(0.05)

    // Discontinuity controls punchiness
    atk = (1 - disc) escale(0.001, 0.1)
    dec = disc escale(0.05, 0.4)

    // Density drives filter punch
    filterEnv = ad(0.01, dec)
    cutoff = filterEnv * dens escale(1000, 12000)

    freq = noteFreq
    osc = freq saw + (freq * 2.01) saw * 0.3

    filtered = osc lpf(cutoff + 200, 0.5)
    out = filtered * adsr(atk, dec, 0.3, 0.2) * ink lscale(0.3, 1)
  `,

  directionBell: `
    cy = param1 lglide(0.1)
    entropy = param7 lglide(0.1)
    circRatio = param10 lglide(0.1)

    // Base frequency with pitch shift
    freq = noteFreq * (1 + cy * 0.5)

    // Bell-like harmonics, spacing affected by entropy
    h1 = entropy lscale(2.0, 2.4)
    h2 = entropy lscale(3.0, 3.8)

    oscs = (
      freq sine +
      (freq * h1) sine * 0.6 +
      (freq * h2) sine * 0.4 +
      (freq * 5.43) sine * 0.2
    ) / 2.2

    // Decay time based on circle ratio (rounder = longer ring)
    ringTime = circRatio escale(0.3, 3)

    out = oscs * adsr(0.001, ringTime, 0, ringTime)
  `,

  // Original patches below
  sine: `
    out = sine(440 * param1)
  `,
  duranDuran: `
    decay = 0.102
    delayAmt = 0.547
    detuneAmt = 0.252
    portamento = param1
    f1 = noteFreq eglide(portamento)
    f2 = f1 * detuneAmt escale(1.01, 1.05)
    oscs = (f1 pwm + f2 pwm) / 2
    dry = oscs * adsr(0, 0, 1, decay escale(0.1, 2))
    out = dry + delayAmt * dry delay(0.378)
  `,
  tomSawyer: `
    resonance = 0.655
    w = 0.5 + (1/5) sine normalize lscale(0, 0.4)
    detune1 = 0.091 * 0.01
    detune2 = 0.836 * 0.01
    delayAmt = 0.127
    freq = noteFreq / 2
    oscs =
      (
        (freq * (1 - detune1)) pwm(w) +
        (freq * (1 + detune1)) pwm(w) +
        (freq * (1 - 3 * detune2)) pwm(w) +
        (freq * (1 + 3 * detune2)) pwm(w)
      ) / 4
    filterEnv = adsr(0.05, 0, 1, 3) escale(0, 1)
    ampEnv = adsr(0, 0, 1, 6)
    dry = oscs lpf12(10000 * filterEnv, resonance) * ampEnv
    out = dry + delayAmt * dry delay(0.15)
  `,
  rickAndMorty: `
    sound1 = noise bpf(0.2 sine * 800 + 1200, 1)
    sound2 = noise bpf(-(0.25 sine) * 800 + 1200, 1)
    ring = (sound1 + sound1 delay(2) + sound2) * 5.5 pwm normalize * 0.5
    out = ring * adsr(0.01, 0, 1, 2)
  `,
  helloAgain: `
    sync = 0.6
    osc1 = (noteFreq / 4) pwm
    osc2 = sync * 500 * ad(0.2, 0.5) >> pwm(0.5, osc1)
    out = osc2 * adsr(0.05, 0, 1, 0.2)
  `,
  square: `
    out = noteFreq pwm * adsr(0.01, 0, 1, 0.3)
  `,
  saw: `
    out = noteFreq saw * adsr(0.01, 0, 1, 0.3)
  `,
  pwm: `
    out = noteFreq pwm(param1 lglide(0.05) lscale(0.2, 0.8)) * adsr(0.05, 0, 1, 0.4)
  `,
  slowSaw: `
    mod = (param1 lglide(0.1) * 10) sine * param2 lglide(0.1) lscale(0.01, 0.05)
    out = (noteFreq * (1 + mod)) saw * adsr(0.1, 0.2, 0.5, 1)
  `,
  noise: `
    out = noise lpf(param1 * 20000, .5)
  `,
};
