import { drumConfigs, DrumMachineConfig, DrumSamplePlayerConfig } from "./music/drum";
import { InstrumentSamplePlayerConfig, SampleInstrumentConfig, sampleInstrumentConfigs } from "./music/sample-instrument";

export const ROW_COUNT: number = 15;

export type SongConfig = {
    isMonophonic: boolean,
    root: string,
    mode: string,
    tempo: number,
    stepDirection: number, // 1 for forward, -1 for backward
    bars: number, // 1-4
    stepsPerBar: number,
    instrument: SampleInstrumentConfig,
    drum: DrumMachineConfig,
    // TODO: A hack to support loading in an externally defined Instrument
    // implementation. If one exists, it overrides the SampleInstrument that
    // is normally used.
    overridingInstrument: string | null,
};

export function defaultSongConfig(): SongConfig {
    return {
        isMonophonic: false,
        root: "C",
        mode: "major",
        tempo: 120,
        stepDirection: 1,
        bars: 2,
        stepsPerBar: 8,
        instrument: sampleInstrumentConfigs["piano"],
        drum: drumConfigs["linn"],
        overridingInstrument: null,
        // overridingInstrument: '/automerge/37r24kFLSfcXrd6ozrwcLemPkEpc',
    };
}

export function barCountFromConfig(config: SongConfig): number {
    return config.bars * config.stepsPerBar
}

export function totalStepsFromConfig(config: SongConfig): number {
    return 4 * config.stepsPerBar
}

export function stepDurationFromConfig(config: SongConfig): number {
    // return (60 / config["tempo"]) / 2
    return ((60 / config.tempo) / (2 * config.stepsPerBar)) * 8
}
