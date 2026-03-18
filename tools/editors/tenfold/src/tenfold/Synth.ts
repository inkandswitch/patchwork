import * as midi from "./msynth/midi-message-constructors.ts"

export class Synth {
  synth: AudioWorkletNode
  messageField: HTMLDivElement | undefined
  params = new Float32Array(new SharedArrayBuffer(128 * 4))

  constructor(context: AudioContext, code: string) {
    this.synth = new AudioWorkletNode(context, "msynth", {
      channelInterpretation: "discrete", // Important…
      channelCountMode: "explicit", // …apparently…
      channelCount: 2, // …sigh.
    })

    this.synth.port.onmessage = (msg) => {
      if (this.messageField) {
        this.messageField.textContent = msg.data.message.replace("error loading patch:", "")
      }
      console.log(msg.data)
    }

    this.setPatch(code)
  }

  setMessageField(mf: HTMLDivElement) {
    this.messageField = mf
  }

  setParam(index: number, value: number) {
    this.params[index] = value
  }

  setPatch(code: string) {
    if (this.messageField) {
      this.messageField.textContent = ""
    }
    this.synth.port.postMessage({
      command: "load patch",
      code,
      params: this.params.buffer,
    })
  }

  midi(data: Uint8Array) {
    this.synth.port.postMessage({ command: "process midi message", data })
  }

  noteOn(note: number, velocity = 127) {
    this.midi(midi.noteOn(0, note, velocity))
  }

  noteOff(note: number) {
    this.midi(midi.noteOff(0, note, 0))
  }
}
