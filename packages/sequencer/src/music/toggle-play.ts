import { SongConfig } from "../config";
import { DrumSamplePlayerConfig } from "./drum";
import {
  InstrumentScheduler,
  globalInstrumentSchedulers,
  Step,
} from "./instrument-scheduler";
import { InstrumentSamplePlayerConfig } from "./sample-instrument";
import { SamplePlayer } from "./sample-player";

let playing = false;
let wrkrs: Worker[] = [];
// let instrumentSchedulers: InstrumentScheduler[] = [];
let audioContext: AudioContext;

export function toggleFn(
  stepGrid: Step[],
  setPlayingIdx: (idx: number) => void,
  setIsPlaying: (isPlaying: boolean) => void,
  setPlayStartTime: (time: number) => void,
  setOverridingInstrumentChosen: (shouldIgnore: boolean) => void,
  fetchOverridingInstrument: (overridingInstrumentUrl: string) => boolean,
  config: SongConfig
): (
  instrumentVolume: number,
  drumVolume: number,
  overridingInstrumentChosen: boolean
) => void {
  let wrkr: Worker;
  return (instrumentVolume, drumVolume, overridingInstrumentChosen) => {
    if (playing) {
      playing = false;
      setIsPlaying(false);
      setPlayStartTime(0);
      for (let w of wrkrs) {
        w.terminate();
      }
      for (let isch of globalInstrumentSchedulers) {
        isch.cancelSchedule();
      }
      globalInstrumentSchedulers.length = 0;
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContext();
      for (let isch of globalInstrumentSchedulers) {
        isch.initContext(audioContext);
      }
    }
    let instrumentSamplePlayerConfig = new InstrumentSamplePlayerConfig(
      config.instrument
    );
    let drumSamplePlayerConfig = new DrumSamplePlayerConfig(config.drum);
    let instrumentSampler = new SamplePlayer(
      instrumentSamplePlayerConfig,
      instrumentVolume
    );
    let drumSamplePlayer = new SamplePlayer(drumSamplePlayerConfig, drumVolume);
    let instrumentScheduler = new InstrumentScheduler(
      setPlayingIdx,
      instrumentSampler,
      drumSamplePlayer
    );
    if (config.overridingInstrument && !overridingInstrumentChosen) {
      fetchOverridingInstrument(config.overridingInstrument);
      setOverridingInstrumentChosen(true);
    }
    instrumentScheduler.initContext(audioContext);
    globalInstrumentSchedulers.push(instrumentScheduler);

    playing = true;
    setIsPlaying(true);
    setPlayStartTime(Date.now());
    const startTime = audioContext.currentTime + 0.05;
    instrumentScheduler.prepare_new_schedule(stepGrid, startTime, config);

    if (window.Worker) {
      wrkr = new Worker(new URL("../sequencer-worker.js", import.meta.url));
      wrkrs.push(wrkr);

      wrkr.onmessage = function (_e) {
        if (instrumentScheduler.isLoaded) {
          instrumentScheduler.schedule_next();
        }
      };
    } else {
      console.log("Your browser doesn't support web workers.");
    }
  };
}
