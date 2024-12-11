import { SamplePlayerConfig } from "./sample-player";

const drumPieces = ["kick", "snare", "hi-hat", "percussion"];

export const drumSampleNoteIdxs: Record<string, number> = {
  kick: 0,
  snare: 1,
  "hi-hat": 2,
  percussion: 3,
};

export type DrumMachineConfig = {
  name: string;
  volModifiers: Record<string, number>;
  sampleFormat: string;
};

function buildDrumSampleUrl(
  piece: string,
  drum: string,
  format: string
): string {
  return DRUM_SAMPLES_URL + drum + "/" + piece + "." + format;
}
export class DrumSamplePlayerConfig implements SamplePlayerConfig {
  drumMachineConfig: DrumMachineConfig;

  constructor(drumMachineConfig: DrumMachineConfig) {
    this.drumMachineConfig = drumMachineConfig;
  }

  name(): string {
    return this.drumMachineConfig.name;
  }

  sampleUrls(): string[] {
    return drumPieces.map((piece) => {
      return buildDrumSampleUrl(
        piece,
        this.drumMachineConfig["name"],
        this.drumMachineConfig["sampleFormat"]
      );
    });
  }

  sampleIdx(note: string): number {
    return drumSampleNoteIdxs[note];
  }

  modifiedVolume(baseVolume: number, note: string): number {
    return baseVolume * this.drumMachineConfig["volModifiers"][note];
  }

  attack(note: string): number {
    return 0.01;
  }

  sustain(note: string): number {
    return 0.5;
  }

  updateSourcePlaybackRate(
    note: string,
    sampleIdx: number,
    source: AudioBufferSourceNode
  ): void {}
}

// Each drum machine name corresponds to a subfolder of the drum
// samples folder. Each should contain the following samples:
// kick, snare, hi-hat, and percussion. You can specify the audio file format
// in the config for a drum.
// For example, if you configure "wav", then the sample files should be
// "kick.wav", "snare.wav", "hi-hat.wav", and "percussion.wav".
export const DRUM_PIECES_COUNT: number = 4;
export const DRUM_SAMPLES_URL: string = "../../assets/samples/drums/";
export const drumConfigs: Record<string, DrumMachineConfig> = {
  linn: {
    name: "linn",
    volModifiers: {
      kick: 1,
      snare: 1,
      "hi-hat": 0.1,
      percussion: 1,
    },
    sampleFormat: "wav",
  },
  "CR-78": {
    name: "CR-78",
    volModifiers: {
      kick: 3,
      snare: 3,
      "hi-hat": 0.5,
      percussion: 0.5,
    },
    sampleFormat: "wav",
  },
  drumTraks: {
    name: "drumTraks",
    volModifiers: {
      kick: 6,
      snare: 6,
      "hi-hat": 3,
      percussion: 3,
    },
    sampleFormat: "wav",
  },
};
