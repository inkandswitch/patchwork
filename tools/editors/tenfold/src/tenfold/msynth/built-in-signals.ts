import { Signal } from "./signal.ts"

export const builtInSignals = {
  noise: () => Signal.new(() => Math.random() * 2 - 1),
  noteFreq: () => Signal.new((synth) => synth.noteFreq),
  noteVel: () => Signal.new((synth) => synth.noteVel),
  t: () => Signal.new((synth) => synth.params[0]),
  x: () => Signal.new((synth) => synth.params[1]),
  y: () => Signal.new((synth) => synth.params[2]),
  q: () => Signal.new((synth) => synth.params[3]),
  r: () => Signal.new((synth) => synth.params[4]),
}
