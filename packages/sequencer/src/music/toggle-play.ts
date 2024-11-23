import { SongConfig } from "../datatype";
import { DrumSamplePlayerConfig } from "./drum";
import {
  InstrumentScheduler,
  globalInstrumentSchedulers,
  Step,
} from "./instrument-scheduler";
import { InstrumentSamplePlayerConfig } from "./sample-instrument";

let playing = false;
let wrkrs: Worker[] = [];
// let instrumentSchedulers: InstrumentScheduler[] = [];
let audioContext: AudioContext;

export function toggleFn(
  stepGrid: Step[],
  setPlayingIdx: (idx: number) => void,
  setIsPlaying: (isPlaying: boolean) => void,
  setPlayStartTime: (time: number) => void,
  incrementToggleAges: () => void,
  config: SongConfig
): (instrumentVolume: number, drumVolume: number) => void {
  let wrkr: Worker;
  return (instrumentVolume, drumVolume) => {
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
    let instrumentScheduler = new InstrumentScheduler(
      setPlayingIdx,
      instrumentSamplePlayerConfig,
      drumSamplePlayerConfig,
      instrumentVolume,
      drumVolume,
      incrementToggleAges
    );
    instrumentScheduler.initContext(audioContext);
    if (config.overridingInstrument) {
      console.log(config.overridingInstrument);
      import(config.overridingInstrument).then((mod) => {
        let weirdInst = new mod.PianoSynth();
        instrumentScheduler.updateInstrument(weirdInst);
      });
    }
    globalInstrumentSchedulers.push(instrumentScheduler);

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

    playing = true;
    setIsPlaying(true);
    setPlayStartTime(Date.now());
    const startTime = audioContext.currentTime + 0.05;
    instrumentScheduler.prepare_new_schedule(stepGrid, startTime, config);

    if (window.Worker) {
      wrkr = new Worker(
        new URL("/workers/sequencer-worker.js", import.meta.url)
      );
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
