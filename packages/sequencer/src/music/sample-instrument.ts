import { noteToNumber } from "./notes";
import { SamplePlayerConfig } from "./sample-player";

const octaveNotes = ["G2", "G3", "G4", "G5"];

function buildInstrumentSampleUrl(note: string, instrument: string, format: string): string {
    return INSTRUMENT_SAMPLES_URL + instrument + "/" + note + "." + format
}

let noteSampleNumbers = [
    42,
    54,
    66,
    78
];

let noteSampleNumberIdxs: Record<number, number> = {
    42: 0,
    54: 1,
    66: 2,
    78: 3,
};

function closestSample(noteNumber: number): number {
    if (noteNumber < 48) {
        return 42
    } else if (noteNumber < 60) {
        return 54
    } else if (noteNumber < 72) {
        return 66
    } else {
        return 78
    }
}

export type SampleInstrumentConfig = {
    "name": string,
    "volModifier": number,
    "attack": number,
    "sustain": number,
    "sampleFormat": string,
};

export class InstrumentSamplePlayerConfig implements SamplePlayerConfig {
    sampleInstrumentConfig: SampleInstrumentConfig;

    constructor(sampleInstrumentConfig: SampleInstrumentConfig) {
        this.sampleInstrumentConfig = sampleInstrumentConfig;
    }

    name(): string {
        return this.sampleInstrumentConfig.name
    }

    sampleUrls(): string[] {
        return octaveNotes.map((note) => {
            return buildInstrumentSampleUrl(note, this.sampleInstrumentConfig["name"], this.sampleInstrumentConfig["sampleFormat"])
        })
    }

    sampleIdx(note: string): number {
        let noteNumber = noteToNumber(note);
        return noteSampleNumberIdxs[closestSample(noteNumber)]
    }

    modifiedVolume(baseVolume: number, note: string): number {
        return baseVolume * this.sampleInstrumentConfig["volModifier"];
    }

    attack(note: string): number {
        return this.sampleInstrumentConfig["attack"]
    }

    sustain(note: string): number {
        return this.sampleInstrumentConfig["sustain"]
    }

    updateSourcePlaybackRate(note: string, sampleIdx: number, source: AudioBufferSourceNode): void {
        let noteNumber = noteToNumber(note);
        source.playbackRate.value = 2 ** ((noteNumber - noteSampleNumbers[sampleIdx]) / 12);
    }
}

// Each instrument name corresponds to a subfolder of the instrument
// samples folder. Each should contain the following samples:
// G2, G3, G4, and G5. You can specify the audio file format in the
// config for an instrument.
// For example, if you configure "wav", then the sample files should be
// "G2.wav", "G3.wav", "G4.wav", and "G5.wav".
export const INSTRUMENT_SAMPLES_URL: string = "/samples/instruments/";
export const sampleInstrumentConfigs: Record<string, SampleInstrumentConfig> = {
    "piano": {
        "name": "piano",
        "volModifier": 1.8,
        "attack": 0.01,
        "sustain": 0.5,
        "sampleFormat": "mp3",
    },
    "epiano": {
        "name": "epiano",
        "volModifier": 2.5,
        "attack": 0.01,
        "sustain": 0.5,
        "sampleFormat": "mp3",
    },
    "viola": {
        "name": "viola",
        "volModifier": 0.4,
        "attack": 0.01,
        "sustain": 0.2,
        "sampleFormat": "wav",
    },
    "staccato": {
        "name": "staccato",
        "volModifier": 0.4,
        "attack": 0.00,
        "sustain": 0.75,
        "sampleFormat": "wav",
    },
};
