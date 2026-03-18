import { Signal } from "./signal.ts"
import { toFrequency } from "./helpers.ts"

export class Synth {
  noteNums: number[] = []
  noteNum = 0
  noteFreq = 0
  noteVel = 0

  constructor(readonly outs: Signal[], readonly allSignals: Signal[], readonly params: Float32Array<any>) {}

  processMidiMessage([d1, d2, d3]: Uint8Array) {
    switch (d1 >> 4) {
      case 0b1001: {
        const note = d2
        const velocity = d3
        if (velocity === 0) {
          // some devices send noteOn with vel 0 for noteOff!
          this.noteOff(note, velocity)
        } else {
          this.noteOn(note, velocity)
        }
        break
      }
      case 0b1000: {
        const note = d2
        const velocity = d3
        this.noteOff(note, velocity)
        break
      }
    }
  }

  noteOn(note: number, vel: number) {
    this.noteNums.push(note)
    this.noteNum = note
    this.noteFreq = toFrequency(note)
    this.noteVel = vel / 127
    this.allSignals.forEach((s) => s.noteOn?.(this, false))
  }

  noteOff(note: number, vel: number) {
    const idx = this.noteNums.indexOf(note)
    const retriggerNext = idx === this.noteNums.length - 1
    this.noteNums.splice(idx, 1)
    const nextNote = this.noteNums.at(-1)
    if (nextNote != null && retriggerNext) {
      this.noteNum = nextNote
      this.noteFreq = toFrequency(nextNote)
      this.allSignals.forEach((s) => s.noteOn?.(this, true))
    } else if (this.noteNums.length === 0) {
      this.allSignals.forEach((s) => s.noteOff?.())
    }
  }

  processFrame(frameIdx: number, output: Float32Array[]) {
    this.allSignals.forEach((s) => s.computeSample(frameIdx, this))
    if (this.outs.length === 2 && output.length >= 2) {
      // stereo
      for (let ch = 0; ch < 2; ch++) {
        const sample = this.outs[ch].value
        output[ch][frameIdx] += sample
      }
    } else {
      // mono
      const sample = this.outs[0].value
      for (let ch = 0; ch < output.length; ch++) {
        output[ch][frameIdx] += sample
      }
    }
  }
}
