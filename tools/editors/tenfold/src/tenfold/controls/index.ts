import { drawAmpersand } from "./ampersand.ts"
import { createChaosControl } from "./chaos.ts"
import { createSoundControl } from "./sound.ts"
import { createTimeControl } from "./time.ts"
import { createWaffles } from "./waffles.ts"

export type { ControlCtx, Region, HitResult, DrawAPI } from "./types.ts"

// Assembles all control surface modules.
// onTimeUpdate is called (with a new t value) when the time control changes its phase.
export function createControlSurface(
  cc: import("./types.ts").ControlCtx,
  onTimeUpdate: (t: number) => void,
) {
  const waffles = createWaffles(cc)
  const chaosControl = createChaosControl(cc)
  const soundControl = createSoundControl(cc)
  const timeControl = createTimeControl(cc, onTimeUpdate)

  // Control regions are checked before waffle so clicks in the controls strip
  // don't fall through to the waffle handler.
  const regions = [chaosControl.region, soundControl.region, timeControl.region, waffles.region]

  let lastMs = 0

  function draw(t: number, ms: number) {
    const dt = lastMs === 0 ? 0 : Math.min((ms - lastMs) / 1000, 0.1)
    lastMs = ms

    cc.api.setCtx(cc.ctx)
    cc.ctx.strokeStyle = cc.color
    cc.ctx.fillStyle = cc.color

    drawAmpersand(cc)
    waffles.draw()
    chaosControl.draw(dt)
    soundControl.draw(dt)
    timeControl.draw(dt, t)
  }

  // Expose control state so other systems (audio, letter rendering) can read it
  return {
    draw,
    regions,
    get chaosOn() { return chaosControl.on },
    get soundOn() { return soundControl.on },
    get playing() { return timeControl.playing },
    set playing(v: boolean) { timeControl.playing = v },
  }
}
