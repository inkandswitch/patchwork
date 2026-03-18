import { SAMPLE_RATE } from "./msynth/constants.ts"
import workletUrl from "./msynth/msynth-worklet.ts?worker&url"

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

function setupMix(context: AudioContext) {
  const input = new GainNode(context)
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

  return input
}

// // Example: play a chord across different synths
// synths[0].noteOn(60) // C4
// synths[1].noteOn(64) // E4
// synths[2].noteOn(67) // G4

// // Tweak some parameters
// synths[0].setParam(1, 0.5) // param1 = 0.5
// synths[7].setParam(1, 0.8) // slowSaw mod amount
// synths[7].setParam(2, 0.3) // slowSaw mod depth

// // Release after 1 second
// setTimeout(() => {
//   synths[0].noteOff(60)
//   synths[1].noteOff(64)
//   synths[2].noteOff(67)
// }, 1000)

export async function setupContext() {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE })
  await context.audioWorklet.addModule(workletUrl)
  const input = setupMix(context)
  return { context, input }
}
