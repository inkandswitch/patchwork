import { Signal } from './signal';
import { compile } from './compiler';
import { MessageFromWorklet, MessageToWorklet } from './types';
import { Synth } from './synth';

export class Msynth extends AudioWorkletProcessor implements AudioWorkletProcessorImpl {
  static get parameterDescriptors() {
    return [
      {
        name: 'masterGain',
        defaultValue: 0.2,
        minValue: 0,
        maxValue: 1,
        automationRate: 'a-rate',
      },
    ];
  }

  synth: Synth | null = null;

  constructor() {
    super();
    this.port.onmessage = (msg: MessageEvent<MessageToWorklet>) => this.onMessage(msg.data);
  }

  sendMessage(msg: MessageFromWorklet, transferObjects: Transferable[] = []) {
    this.port.postMessage(msg, transferObjects);
  }

  onMessage(msg: MessageToWorklet) {
    switch (msg.command) {
      case 'load patch': {
        try {
          const makeSignals = compile(msg.code);
          const allSignals: Signal[] = [];
          const outs = Signal.doCollectingNewInstances(makeSignals, allSignals);
          this.synth = new Synth(outs, allSignals, new Float32Array<any>(msg.params));
        } catch (e: any) {
          this.sendMessage({ event: 'log', message: `error loading patch: ${e.message}` });
          console.error(e);
        }
        break;
      }
      case 'process midi message': {
        this.synth?.processMidiMessage(msg.data);
        break;
      }
      default: {
        console.error('unsupported message', msg);
        throw new Error('unsupported message!');
      }
    }
  }

  process(inputs: Float32Array[][], [output]: Float32Array[][], parameters: any) {
    const numFrames = output[0].length;
    let gain = parameters.masterGain[0];
    for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
      this.synth?.processFrame(frameIdx, output);
      gain = parameters.masterGain[frameIdx] ?? gain;
      if (gain !== 1) {
        for (let ch = 0; ch < output.length; ch++) {
          output[ch][frameIdx] *= gain;
        }
      }
    }
    return true;
  }
}

registerProcessor('msynth', Msynth);
