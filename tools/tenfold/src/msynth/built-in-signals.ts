import { Signal } from './signal';

export const builtInSignals = {
  noise: () => Signal.new(() => Math.random() * 2 - 1),
  noteFreq: () => Signal.new((synth) => synth.noteFreq),
  noteVel: () => Signal.new((synth) => synth.noteVel),
};
