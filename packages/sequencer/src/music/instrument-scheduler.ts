import { stepDurationFromTempo } from "../components/Player";
import { barCountToStepCount } from "../config";
import { SongConfig } from "../datatype";
import { DrumSamplePlayerConfig } from "./drum";
import { Instrument } from "./instrument";
import { InstrumentSamplePlayerConfig, SampleInstrumentConfig } from "./sample-instrument";
import { SamplePlayer } from "./sample-player";

// TODO: We're currently using this as a global value in order to enable changing
// things like instrument or drum samples on the fly while a song is playing.
// Ideally, we'd find a cleaner solution.
export const globalInstrumentSchedulers: InstrumentScheduler[] = [];

export const STEP_DURATION = 0.250

export type Step = {
  "instrument": Record<string, Note>,
  "drum": Record<string, Note>,
};

export class Note {
  duration: number;
  note: string;
  offset: number;

  constructor(note: string, duration: number, offset: number) {
    this.duration = duration
    this.note = note
    this.offset = offset
  }
}

interface Scheduleable {
  start(): void;
  stop(): void;
  playNext(instrument: Instrument, drum: Instrument): void;
  nextScheduledTime(): number;
  stillPlaying(): boolean;
  updateConfig(config: SongConfig): void;
}

class EmptySchedule implements Scheduleable {
  start() {}
  stop() {}
  playNext(instrument: Instrument, drum: Instrument) {}
  nextScheduledTime(): number { return 0 }
  stillPlaying(): boolean { return false }
  updateConfig(config: SongConfig) {}
}

class FullSchedule implements Scheduleable {
  startTime: number;
  idx: number;
  steps: Step[];
  stopped: boolean;
  nextTimeOffset: number;
  setPlayingIdx: (idx: number) => void;
  incrementToggleAges: () => void;
  config: SongConfig;

  constructor(startTime: number, steps: Step[], setPlayingIdx: (idx: number) => void, incrementToggleAges: () => void, config: SongConfig) {
    this.stopped = false;
    this.startTime = startTime;
    this.steps = steps;
    this.nextTimeOffset = 0.0;
    this.idx = 0;
    this.setPlayingIdx = setPlayingIdx;
    this.incrementToggleAges = incrementToggleAges;
    this.config = config;
  }

  start() {
    this.stopped = false;
  }

  stop() {
    this.stopped = true;
    this.idx = 0;
    this.setPlayingIdx(0);
  }

  updateConfig(config: SongConfig) {
    this.config = config;
  }

  playNext(instrument: Instrument, drum: Instrument) {
    let nextNoteGroup = this.steps[this.idx]["instrument"];
    let nextDrumGroup = this.steps[this.idx]["drum"];
    let startAt = this.startTime + this.nextTimeOffset;
    Object.entries(nextNoteGroup).forEach(([_noteName, note]) => {
      instrument.playSound(note.note, startAt, note.duration, 0.5);
    })
    Object.entries(nextDrumGroup).forEach(([_noteName, note]) => {
      drum.playSound(note.note, startAt, note.duration, 0.5);
    })

    let next_idx = this.idx + 1;
    if (this.config.stepDirection && this.config.stepDirection < 0) {
      next_idx -= 2;
    }
    if (next_idx < 0) {
      next_idx = (this.steps.length * this.config.bars) - 1;
    }
    let stepCount = barCountToStepCount(this.config.bars);
    if (next_idx == stepCount) {
      this.incrementToggleAges();
    }
    this.idx = next_idx % stepCount;
    this.setPlayingIdx(this.idx);
    this.nextTimeOffset = this.nextTimeOffset + stepDurationFromTempo(this.getTempo())
  }

  // TODO: This is a clunky way to get around a UI issue where starting to type
  // in a tempo starting with 1 creates a problem that freezes the song.
  getTempo(): number {
    if (this.config.tempo > 20) {
      return this.config.tempo
    } else {
      return 20
    }
  }

  nextScheduledTime(): number {
    return this.startTime + this.nextTimeOffset
  }

  stillPlaying(): boolean {
    return !this.stopped && (this.idx < this.steps.length)
  }
}

export class InstrumentScheduler {
  instrument: Instrument;
  drum: Instrument;
  instrumentLoaded: boolean;
  drumLoaded: boolean;
  isLoaded: boolean;
  context: AudioContext | null;

  fullSchedule: Scheduleable;
  incrementToggleAges: () => void;
  setPlayingIdx: (idx: number) => void;

  constructor(setPlayingIdx: (idx: number) => void, instrument: Instrument, drum: Instrument, incrementToggleAges: () => void) {
    this.isLoaded = false;
    this.instrumentLoaded = false;
    this.drumLoaded = false;
    this.context = null;
    this.instrument = instrument;
    this.drum = drum;
    this.fullSchedule = new EmptySchedule();
    this.incrementToggleAges = incrementToggleAges;
    this.setPlayingIdx = setPlayingIdx;
  }

  prepare_new_schedule(steps: Step[], startTime: number, config: SongConfig) {
    this.fullSchedule.stop();
    this.fullSchedule = new FullSchedule(startTime, steps, this.setPlayingIdx, this.incrementToggleAges, config);
  }

  updateConfig(config: SongConfig) {
    this.fullSchedule.updateConfig(config);
  }

  updateInstrumentVolumeModifier(volumeModifier: number) {
    this.instrument.updateVolumeModifier(volumeModifier);
  }

  updateDrumVolumeModifier(volumeModifier: number) {
    this.drum.updateVolumeModifier(volumeModifier);
  }

  initContext(context: AudioContext) {
    this.context = context;
    this.instrument.initContext(context, this.completeLoadedInstrument.bind(this));
    this.drum.initContext(context, this.completeLoadedDrum.bind(this));
  }

  updateInstrument(instrument: Instrument) {
    if (!this.context) {
      console.error("InstrumentScheduler expected AudioContext");
      return
    }
    instrument.initContext(this.context, this.completeLoadedInstrument.bind(this));
  }

  updateDrum(drum: Instrument) {
    if (!this.context) {
      console.error("InstrumentScheduler expected AudioContext");
      return
    }
    drum.initContext(this.context, this.completeLoadedDrum.bind(this));
  }

  completeLoadedInstrument(instrument: Instrument) {
    this.instrument = instrument;
    this.instrumentLoaded = true;
    if (this.drumLoaded) {
      this.isLoaded = true;
    }
  }

  completeLoadedDrum(drum: Instrument) {
    this.drum = drum;
    this.drumLoaded = true;
    if (this.instrumentLoaded) {
      this.isLoaded = true;
    }
  }

  cancelSchedule() {
    this.fullSchedule.stop();
  }

  playNext() {
    if (!this.context) {
      console.error("InstrumentScheduler expected AudioContext");
      return
    }
    this.fullSchedule.playNext(this.instrument, this.drum);
    if ((this.fullSchedule.nextScheduledTime() - this.context.currentTime) < 0.050) {
      this.playNext();
    }
  }

  // Any scheduled future event WILL play and can't be stopped. So
  // we can't schedule far in the future if we want a stoppable player.
  is_time_to_play() {
    if (!this.context) {
      console.error("InstrumentScheduler expected AudioContext");
      return
    }
    return (this.fullSchedule.nextScheduledTime() - this.context.currentTime) < 0.050
  }

  schedule_next() {
    if (this.fullSchedule.stillPlaying()) {
      if (this.is_time_to_play()) {
        this.playNext();
      }
      return true
    }
    return false
  }
}
