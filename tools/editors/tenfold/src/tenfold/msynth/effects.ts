import { SAMPLE_RATE } from "./constants.ts"
import { Signal } from "./signal.ts"
import { interpolatedRead } from "./helpers.ts"

const MAX_DELAY_SECONDS = 10
const DELAY_BUFFER_SIZE = MAX_DELAY_SECONDS * SAMPLE_RATE

// TODO: add support for multiple taps
// maybe delay(signal, t1, v1, t2, v2, ...)
export function delay(input: Signal, t: Signal) {
  const bufferSize = DELAY_BUFFER_SIZE
  const buffer = new Float32Array(bufferSize)
  let writePos = 0
  return Signal.new(() => {
    let readPos = writePos - Math.min(t.value, MAX_DELAY_SECONDS) * SAMPLE_RATE
    if (readPos < 0) {
      readPos += bufferSize
    }
    buffer[writePos++] = input.value
    if (writePos >= bufferSize) {
      writePos = 0
    }
    return interpolatedRead(buffer, readPos)
  })
}
