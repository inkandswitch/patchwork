export function noteOn(ch: number, note: number, velocity: number) {
  return new Uint8Array([0x90 | (ch & 0b1111), note & 0x7f, velocity & 0x7f]);
}

export function noteOff(ch: number, note: number, velocity: number) {
  return new Uint8Array([0x80 | (ch & 0b1111), note & 0x7f, velocity & 0x7f]);
}

export function ccChange(ch: number, cc: number, value: number) {
  return new Uint8Array([0xb0 | (ch & 0b1111), cc & 0x7f, value & 0x7f]);
}

export function pitchBend(ch: number, value: number) {
  const intValue = Math.max(0, Math.min(16383, Math.round(value)));
  return new Uint8Array([0xe0 | (ch & 0b1111), intValue & 0x7f, (intValue >> 7) & 0x7f]);
}

export function pressure(ch: number, value: number) {
  return new Uint8Array([0xd0 | (ch & 0b1111), value & 0x7f, 0]);
}
