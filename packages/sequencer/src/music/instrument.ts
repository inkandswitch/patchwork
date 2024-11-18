export interface Instrument {
    initContext(context: AudioContext, completeLoaded: (instrument: Instrument) => void): void;
    // The note is a string note name (like "Gb4"). Time is the time to schedule the
    // note. Volume is from 0.0 to 1.0.
    playSound(note: string, time: number, duration: number, origVolume: number): void;
    updateVolumeModifier(volumeModifier: number): void;
    name(): string;
}
