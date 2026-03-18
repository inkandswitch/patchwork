import * as midi from "./midi-message-constructors.ts"
import { SAMPLE_RATE } from "./constants.ts"
import { MessageToWorklet } from "./types.ts"

export {}

const uiDiv = document.body

const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d")!
uiDiv.appendChild(canvas)

function updateCanvasSize() {
  canvas.width = innerWidth
  canvas.height = innerHeight

  // setup the canvas for device-independent pixels
  if (devicePixelRatio !== 1) {
    const oldW = canvas.width
    const oldH = canvas.height
    canvas.width = oldW * devicePixelRatio
    canvas.height = oldH * devicePixelRatio
    canvas.style.width = oldW + "px"
    canvas.style.height = oldH + "px"
    ctx.scale(devicePixelRatio, devicePixelRatio)
  }
}

window.addEventListener("resize", updateCanvasSize)
updateCanvasSize()

// ---- stand-in for the UI ----

const MARGIN = 25
const LETTER_WIDTH = 150
const LETTER_HEIGHT = 150

class Letter {
  public synth: AudioWorkletNode | null = null
  public params: Float32Array<any> | null = null

  constructor(public col: number, public row: number, public x = 0, public y = 0, public isActive = false) {}

  get posX() {
    return MARGIN + this.col * LETTER_WIDTH
  }

  get posY() {
    return MARGIN + this.row * LETTER_HEIGHT
  }

  initWorklet(context: AudioContext, patch: string) {
    const synth = new AudioWorkletNode(context, "msynth")

    // Important!!!!!
    synth.channelInterpretation = "discrete"
    synth.channelCount = 2
    synth.channelCountMode = "explicit"

    synth.port.onmessage = (msg) => console.log("worklet:", msg.data)

    this.synth = synth
    this.params = new Float32Array(new SharedArrayBuffer(128 * 4))
    this.params[100] = this.col

    sendToSynth(synth, {
      command: "load patch",
      code: `
        ${patch}

        wallWidth = 10 // all distances are in feet
        distToWall = 10
        distToWall2 = distToWall * distToWall
        headWidth = 0.6
        speedOfSound = 1125
        thisCol = param100
        thisX = wallWidth * thisCol normalize(0, 2) lscale(-2/3, 2/3)
        leftEarX = -headWidth / 2
        rightEarX = headWidth / 2
        distToLeftEar = sqrt(distToWall2 + (thisX - leftEarX) * (thisX - leftEarX))
        distToRightEar = sqrt(distToWall2 + (thisX - rightEarX) * (thisX - rightEarX))
        delayLeft = distToLeftEar / speedOfSound
        delayRight = distToRightEar / speedOfSound

        pan = thisCol normalize(0, 2) lscale(1/6, 5/6)
        left = out * (1 - pan) >> delay(delayLeft)
        right = out * pan >> delay(delayRight)
      `,
      params: this.params.buffer,
    })

    return synth
  }

  contains(px: number, py: number) {
    return this.posX <= px && px <= this.posX + LETTER_WIDTH && this.posY <= py && py <= this.posY + LETTER_HEIGHT
  }

  moveJoystick(px: number, py: number) {
    const cx = this.posX + LETTER_WIDTH / 2
    const cy = this.posY + LETTER_HEIGHT / 2
    this.x = Math.max(-1, Math.min((px - cx) / (LETTER_WIDTH / 2), 1))
    this.y = Math.max(-1, Math.min((py - cy) / (LETTER_HEIGHT / 2), 1))
    if (this.params) {
      this.params[1] = (this.x + 1) / 2
      this.params[2] = (this.y + 1) / 2
    }
  }

  render() {
    ctx.lineWidth = 4
    ctx.strokeStyle = "#aaa"
    ctx.strokeRect(this.posX, this.posY, LETTER_WIDTH, LETTER_HEIGHT)
    ctx.fillStyle = this.isActive ? "#aaa" : "#ccc"
    ctx.fillRect(this.posX, this.posY, LETTER_WIDTH, LETTER_HEIGHT)

    ctx.fillStyle = "#888"
    const cx = this.posX + LETTER_WIDTH / 2
    const cy = this.posY + LETTER_HEIGHT / 2
    const px = cx + (this.x * LETTER_WIDTH) / 2
    const py = cy + (this.y * LETTER_HEIGHT) / 2
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  noteOn(note: number, velocity: number) {
    sendToSynth(this.synth!, {
      command: "process midi message",
      data: midi.noteOn(0, note, velocity),
    })
  }

  noteOff(note: number, velocity: number) {
    sendToSynth(this.synth!, {
      command: "process midi message",
      data: midi.noteOff(0, note, velocity),
    })
  }
}

const drone = new Letter(1, 3 + MARGIN / LETTER_HEIGHT)
const inkAndSwitchLetters: Letter[] = []
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    inkAndSwitchLetters.push(new Letter(col, row))
  }
}
const letters = [drone, ...inkAndSwitchLetters]

let draggingLetter: Letter | null = null

window.addEventListener("pointerdown", (e) => {
  for (const letter of letters) {
    if (letter.contains(e.clientX, e.clientY)) {
      draggingLetter = letter
      break
    }
  }
})

window.addEventListener("pointermove", (e) => {
  draggingLetter?.moveJoystick(e.clientX, e.clientY)
})

window.addEventListener("pointerup", (e) => {
  draggingLetter = null
})

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight)

  for (const letter of letters) {
    letter.render()
  }

  if (drone.params) {
    drone.col = 1 // + Math.sin(Date.now() / 2000)
    drone.params[100] = drone.col
  }

  requestAnimationFrame(render)
}

render()

// ---- web audio -----

const patchLibrary = {
  macro: `
    // osc = noteFreq saw lpf(100 + 20000 * x lscale(0,1), y)
    // osc = noteFreq sine
    // def sig plucked = sig * ad(.1, .1)
    // def sig stacked(n) = (sig * sine(n)) stacked(n+1)
    // out = sine(1) stacked(2)
    out = noise lpf(x * 20000, .5)
  `,

  helloAgain: `
    sync = 0.6
    osc1 = (noteFreq / 4) pwm
    osc2 = sync * 500 * ad(0.2, 0.5) >> pwm(0.5, osc1)
    out = osc2 * adsr(0.05, 0, 1, 0.2)
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
    resonance = 0.655 // * 2 * param1 lglide(0.1)
    w = 0.5 + (1/5) sine normalize lscale(0, 0.4)
    detune1 = 0.091 * 0.01 // param1 lglide(0.1) * 0.01
    detune2 = 0.836 * 0.01 // detune * 3
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
}

function makeReverb(context: AudioContext, seconds: number, decay: number, reverse: boolean) {
  const wet = context.createGain()
  const dry = context.createGain()
  const input = context.createGain()
  const output = context.createGain()
  const convolver = context.createConvolver()
  const duration = SAMPLE_RATE * seconds
  const impulse = context.createBuffer(2, duration, SAMPLE_RATE)
  const impulseL = impulse.getChannelData(0)
  const impulseR = impulse.getChannelData(1)

  for (let i = 0; i < duration; i++) {
    const n = reverse ? duration - i : i
    impulseL[i] = impulseR[i] = (Math.random() * 2 - 1) * (1 - n / duration) ** decay
  }

  convolver.buffer = impulse
  input.connect(dry).connect(output)
  input.connect(convolver).connect(wet).connect(output)
  return {
    input: input,
    output: output,
    wet: wet.gain,
    dry: dry.gain,
  }
}

async function start() {
  const context = new AudioContext({
    latencyHint: "balanced",
    sampleRate: SAMPLE_RATE,
  })

  await context.audioWorklet.addModule("/msynth/msynth-worklet.ts")

  let melody = { steps: [] as number[][], patches: [] as string[] }
  let bass = { steps: [] as number[][], patch: patchLibrary.square }

  // Demo #1
  // tempo = 100;
  // melody = {
  //   steps: [[52, 60], [62], [64], [65], [64, 67], [69], [71], [72]],
  //   patches: [patchLibrary.slowSaw],
  // };

  // Demo #2
  // tempo = 100;
  // melody = {
  //   steps: [[60, 63], [62], [63], [65], [67], [68], [71], [72]],
  //   patches: [patchLibrary.pwm],
  // };

  // Demo #3: cacophony
  // tempo = 40;
  // melody = {
  //   steps: [[60, 63], [62], [63], [65], [67], [68], [71], [72], [67]],
  //   patches: [...Object.values(patchLibrary)],
  // };

  // Demo #4: save a prayer
  melody = {
    steps: [[62], [62], [62]], //, [64], [65], [69], [72], [69], [72], [69]],
    patches: [patchLibrary.duranDuran, patchLibrary.rickAndMorty, patchLibrary.tomSawyer, patchLibrary.helloAgain],
  }
  bass = {
    // steps: [...repeat(() => [38], 8), ...repeat(() => [41], 8), ...repeat(() => [34], 8), ...repeat(() => [43], 3), ...repeat(() => [41], 5)],
    steps: [[48]],
    patch: patchLibrary.macro,
  }

  const input = new GainNode(context, { gain: 1 })
  const analyser = context.createAnalyser()
  const reverb = makeReverb(context, 0.5, 3, false)
  const softCompressor = context.createDynamicsCompressor()
  const hardCompressor = context.createDynamicsCompressor()
  const output = context.createGain()

  reverb.wet.value = 0.2
  reverb.dry.value = 0.8

  softCompressor.attack.value = 0.05
  softCompressor.knee.value = 10
  softCompressor.ratio.value = 3
  softCompressor.release.value = 0.1
  softCompressor.threshold.value = -15

  hardCompressor.attack.value = 0.003
  hardCompressor.knee.value = 5
  hardCompressor.ratio.value = 15
  hardCompressor.release.value = 0.01
  hardCompressor.threshold.value = -6

  output.gain.value = 0.5

  input.connect(analyser).connect(reverb.input)
  reverb.output.connect(softCompressor).connect(hardCompressor).connect(output)
  output.connect(context.destination)

  drone.initWorklet(context, bass.patch).connect(input)

  inkAndSwitchLetters.forEach((letter, idx) => {
    letter.initWorklet(context, melody.patches[idx % melody.patches.length]).connect(input)
  })

  await seconds(0.5) // wait for patches to load

  // The sequence of LETTERS to move through
  // sequence(
  //   melody.steps,
  //   [3].map((idx) => inkAndSwitchLetters[idx])
  // )

  sequence(bass.steps, [drone])
}

window.addEventListener("pointerdown", start, { once: true })

function sendToSynth(synth: AudioWorkletNode, message: MessageToWorklet) {
  synth.port.postMessage(message)
}

// ---- sequencer -----

let tempo = 120
let triggerPeriod = 1 / 8
let noteDuration = 1 / 16
async function sequence(steps: number[][], letters: Letter[]) {
  if (steps.length === 0) {
    return
  }

  let nextLetterIdx = 0
  while (true) {
    for (const step of steps) {
      const lettersForThisStep: Letter[] = []
      if (letters.includes(draggingLetter!)) {
        step.forEach(() => lettersForThisStep.push(draggingLetter!))
      } else {
        step.forEach(() => {
          const letter = letters[nextLetterIdx]
          lettersForThisStep.push(letter)
          nextLetterIdx = (nextLetterIdx + 1) % letters.length
        })
      }

      step.forEach((note, idx) => {
        const letter = lettersForThisStep[idx]
        letter.noteOn(note, 127)
        letter.isActive = true
      })
      await seconds((60 / tempo) * noteDuration * 4)

      step.forEach((note, idx) => {
        const letter = lettersForThisStep[idx]
        letter.noteOff(note, 127)
        letter.isActive = false
      })
      await seconds((60 / tempo) * (triggerPeriod - noteDuration) * 4)
    }
  }
}

// ----- helpers -----

function seconds(s: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, s * 1000)
  })
}

function repeat<T>(makeValue: (idx: number) => T, n: number) {
  const values: T[] = []
  for (let idx = 0; idx < n; idx++) {
    values.push(makeValue(idx))
  }
  return values
}
