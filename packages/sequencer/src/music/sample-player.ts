import BufferLoader from "./bufferloader";
import { Instrument } from "./instrument";

const SAMPLES = import.meta.glob("../../assets/**/**/*.(wav|mp3)", {
  eager: true,
  query: "?url",
  import: "default",
});

export interface SamplePlayerConfig {
  name(): string;
  sampleUrls(): string[];
  sampleIdx(note: string): number;
  modifiedVolume(baseVolume: number, note: string): number;
  attack(note: string): number;
  sustain(note: string): number;
  updateSourcePlaybackRate(
    note: string,
    sampleIdx: number,
    source: AudioBufferSourceNode
  ): void;
}

export class SamplePlayer implements Instrument {
  samplePlayerConfig: SamplePlayerConfig;
  bufferList: any[];
  sampleUrls: string[];
  context: AudioContext | null;
  volumeModifier: number;
  destination: AudioDestinationNode | null;
  bufferLoader: BufferLoader;
  completeLoaded: ((instrument: Instrument) => void) | null;
  scheduledSources: AudioBufferSourceNode[]; // For stopping scheduled events early.

  constructor(samplePlayerConfig: SamplePlayerConfig, volumeModifier: number) {
    this.samplePlayerConfig = samplePlayerConfig;
    this.bufferList = [];
    console.log({ SAMPLES, spc: this.samplePlayerConfig.sampleUrls() });
    this.sampleUrls = this.samplePlayerConfig
      .sampleUrls()
      .map((url) => SAMPLES[url] as string);
    this.context = null;
    this.volumeModifier = volumeModifier;
    this.destination = null;
    this.bufferLoader = new BufferLoader(
      this.sampleUrls,
      this.finishedLoading().bind(this)
    );
    this.completeLoaded = null;
    this.scheduledSources = []; // For stopping scheduled events early.
  }

  initContext(
    context: AudioContext,
    completeLoaded: (instrument: Instrument) => void
  ) {
    this.context = context;
    this.completeLoaded = completeLoaded;
    let bufferLoader = new BufferLoader(
      this.sampleUrls,
      this.finishedLoading().bind(this)
    );
    bufferLoader.load(this.context);
    this.bufferLoader = bufferLoader;
    this.connect(context.destination);
  }

  name(): string {
    return this.samplePlayerConfig.name();
  }

  finishedLoading(): (bufferList: any[]) => void {
    let samplePlayer: Instrument = this;
    return (bufferList: any[]) => {
      this.bufferList = bufferList;
      if (this.completeLoaded) {
        this.completeLoaded(samplePlayer);
      } else {
        console.log("Something weird happened!");
      }
    };
  }

  connect(destination: AudioDestinationNode) {
    this.destination = destination;
  }

  stop() {
    for (let s of this.scheduledSources) {
      s.stop();
    }
    this.scheduledSources = [];
  }

  updateVolumeModifier(volumeModifier: number) {
    this.volumeModifier = volumeModifier;
  }

  playSound(note: string, time: number, duration: number, origVolume: number) {
    if (!this.context) {
      console.error("SamplePlayer expected AudioContext to be loaded.");
      return;
    }
    if (!this.destination) {
      console.error("SamplePlayer expected destination to be connected.");
      return;
    }
    let source = this.context.createBufferSource();
    this.scheduledSources.push(source);

    let sampleIdx = this.samplePlayerConfig.sampleIdx(note);
    source.buffer = this.bufferList[sampleIdx];
    this.samplePlayerConfig.updateSourcePlaybackRate(note, sampleIdx, source);
    let volume = this.samplePlayerConfig.modifiedVolume(origVolume, note);
    let attack = this.samplePlayerConfig.attack(note);
    let sustain = this.samplePlayerConfig.sustain(note);

    volume = volume * this.volumeModifier;

    let gainNode = this.context.createGain();
    source.connect(gainNode);
    gainNode.connect(this.destination);
    source.start(time);

    let decay = sustain + 0.1;
    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + attack);
    gainNode.gain.setValueAtTime(volume, time + duration + sustain);
    gainNode.gain.linearRampToValueAtTime(0.0, time + duration + decay);
    source.stop(time + duration + decay);
  }
}
