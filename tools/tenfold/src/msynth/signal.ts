import { Synth } from './synth';

type Config = {
  nextSample: (synth: Synth) => number;
  initialValue?: number;
  noteOn?: (synth: Synth, retriggered: boolean) => void;
  noteOff?: () => void;
};

export class Signal {
  private static newInstanceCollector: Signal[] | null = null;

  static doCollectingNewInstances<T>(fn: () => T, collector: Signal[]): T {
    const oldCollector = Signal.newInstanceCollector;
    Signal.newInstanceCollector = collector;
    try {
      return fn();
    } finally {
      Signal.newInstanceCollector = oldCollector;
    }
  }

  static new(config: ((synth: Synth) => number) | Config): Signal {
    return typeof config === 'function'
      ? new Signal(config)
      : new Signal(config.nextSample, config.initialValue, config.noteOn, config.noteOff);
  }

  static scalar(value: number) {
    return Signal.new({ nextSample: () => value, initialValue: value });
  }

  private constructor(
    public readonly nextSample: (synth: Synth) => number,
    public value = 0,
    readonly noteOn?: (synth: Synth, retriggered: boolean) => void,
    readonly noteOff?: () => void,
    readonly writeSharedState?: (pushFn: (x: number) => void) => void,
  ) {
    Signal.newInstanceCollector?.push(this);
  }

  private lastFrameIdx = -1;
  computeSample(frameIdx: number, synth: Synth) {
    if (frameIdx !== this.lastFrameIdx) {
      this.value = this.nextSample(synth);
    }
    return this.value;
  }
}

export const scalar = Signal.scalar;
