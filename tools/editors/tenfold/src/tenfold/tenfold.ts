import { setupContext } from "./audio.ts"
import Averager from "./Averager.ts"
import { activeCollector, collectors, setActiveCollector } from "./drawing-collector.ts"
import { drawText, loadFont } from "./font.ts"
import { patches } from "./patches.ts"
import Spark from "./Spark.ts"
import { Synth } from "./Synth.ts"

export interface CreateTenfoldOptions {
  font: string
  letterCounts: number[]
  letters: ((
    ctx: any,
    params: {
      q: number
      r: number
      t: number
      x: number
      y: number
      s: any
    }
  ) => void)[]
  states: import("../index.tsx").TenfoldState[]
  currentlyEditingIndex: number | undefined | null
  container: HTMLElement
  edit(i: number): void
  set(i: number, field: "q" | "r" | "x" | "y" | "i", val: number): void
  word?: string
}

export default function createTenfold(opts: CreateTenfoldOptions) {
  if (typeof opts.word == "string" && opts.word.length != 9) {
    throw new TypeError(`words are 9 letters long. received: ${opts.word?.toString()}`)
  }
  // CONFIG
  const thick = 2 // css pixels
  const cycleTime = 8 // how many seconds per anim loop
  const color = "#fff"
  const errColor = "#f00"
  const MAX_DPR = 2 // Limit the DPR so we don't burn too much time
  // ugh this shit aint resolution independent what a hack
  const padding = 30
  const gap = 30
  const clockWaveHeight = 20
  const cleanups = new Set<() => void>()
  const states = {} as Record<number, Record<number, any>>
  const useAudio = false

  // ANIMATION STATE
  let t = 0
  const timers: Averager[] = []

  // AUDIO STATE
  const synths: Synth[] = []

  let PRINT = false // This will be enabled when we click the "Test Print" button
  // TODO: also need to bump the line thickness to 4x (because we're printing at roughly 4x scale)

  // HELPFUL HELPERS
  // Ideally, all this stuff (or better equivalents) would be available to people writing letter functions
  const PI = Math.PI
  const TAU = PI * 2

  const mod = (v: number, m = 1) => ((v % m) + m) % m
  const rand = (lo = -1, hi = 1) => denorm(Math.random(), lo, hi)
  const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v))
  const norm = (n: number, lo = -1, hi = 1) => (n - lo) / (hi - lo)
  const clip = (n: number, lo = 0, hi = 1) => ((n - lo) / (hi - lo)) * 2 - 1
  const denorm = (n: number, lo = -1, hi = 1) => n * (hi - lo) + lo
  const declip = (n: number, lo = 0, hi = 1) => ((n + 1) / 2) * (hi - lo) + lo
  const renorm = (v: number, lo = -1, hi = 1, LO = -1, HI = 1, doClamp = false) => {
    let n = norm(v, lo, hi)
    if (doClamp) n = clamp(n, 0)
    return denorm(n, LO, HI)
  }

  const cosn = (n: number) => Math.cos(n * TAU)
  const sinn = (n: number) => Math.sin(n * TAU)

  // rotate point x,y around pivot px,py by turns (normalized)
  const rotate = (x: number, y: number, turns: number, px = 0, py = 0) => {
    const dx = x - px
    const dy = y - py
    const cos = cosn(turns)
    const sin = sinn(turns)
    return {
      x: px + dx * cos - dy * sin,
      y: py + dx * sin + dy * cos,
    }
  }

  const rotaten = (n: number) => {
    // rootin' tootin' rotatn'
    ctx.rotate(n * TAU)
  }

  // UNHELPFUL HELPERS
  let paramNames = [
    "TIME",
    "CANVAS-X",
    "CANVAS-Y",
    "WAFFLE-X",
    "WAFFLE-Y",
    "AVG-X",
    "AVG-Y",
    "PATH-LEN",
    "CURVATURE",
    "DENSITY",
    "DISCONT",
    "ENTROPY",
    "SPREAD-X",
    "SPREAD-Y",
    "ARC-COUNT",
  ]

  let synthEditor = document.querySelector("#synth-editor textarea") as HTMLTextAreaElement
  let messageField = document.querySelector("#message-field") as HTMLDivElement

  let lastCurrentlyEditing = -1

  // Set the patch for a specific synth
  const setSynthPatch = (idx: number, value: String) => {
    let lines = value.trim().split("\n")
    let lastLine = "out = " + (lines.pop() ?? "0")
    lines.push(lastLine)
    synths[idx].setPatch(lines.join("\n"))
  }

  // Get the text value from local storage for a specific synth
  const loadSynthText = (idx: number): string => {
    let codes = JSON.parse(localStorage.getItem("synth-editor") ?? "[]")
    return codes[idx] ?? "0"
  }

  // For whichever synth is being edited, save the text value in storage and update the patch
  const updateCurrentSynth = (value: string) => {
    let idx = opts.currentlyEditingIndex
    if (idx == null) return

    let codes = JSON.parse(localStorage.getItem("synth-editor") ?? "[]")
    codes[idx] = value
    localStorage.setItem("synth-editor", JSON.stringify(codes))

    setSynthPatch(idx, value)
  }

  // CANVAS /////////////////////////////////////////////////////////////////////////////////////////
  const canvas = opts.container.querySelector("canvas")!
  const ctx = canvas.getContext("2d", {
    alpha: true,
  })!
  let dpr: number // device pixel ratio, sigh
  let cssW: number // width of a grid cell in css units
  let pixW: number // width of a grid cell in canvas pixels
  let pixHW: number // half the width of a grid cell in canvas pixels

  function resize() {
    // If we need to nest the canvas within a smaller area, specify that area here
    const box = opts.container.getBoundingClientRect()
    let parentWidth = PRINT ? 3600 : box.width
    let parentHeight = PRINT ? 4800 : box.height

    // calculate the "dead" width/height, eaten up by gaps and padding
    let dw = padding * 2 + gap * 2
    let dh = padding * 2 + gap * 3

    // This is the max area the canvas will be contained within, in CSS pixels
    let iw = parentWidth - dw
    let ih = parentHeight - dh

    // This is the size of a grid cell in CSS pixels
    cssW = Math.min(iw / 3, ih / 4)

    // We need the half-width (hw) to be floored, so we sized things based on that
    cssW = Math.floor(cssW / 2) * 2

    // Now, scale the canvas to cover all grid cells plus gaps and padding
    canvas.style.width = cssW * 3 + dw + "px"
    canvas.style.height = cssW * 4 + dh + "px"

    // Now calculate the internal pixel dimensions of the canvas
    dpr = clamp(Math.round(window.devicePixelRatio || 1), 1, MAX_DPR)
    pixW = cssW * dpr // width
    pixHW = pixW / 2 // half-width — we ensured that this is an integer
    canvas.width = pixW * 3 + dw * dpr
    canvas.height = pixW * 4 + dh * dpr
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(opts.container)
  cleanups.add(() => resizeObserver.disconnect())
  resize()
  window.addEventListener("resize", resize)
  cleanups.add(() => window.removeEventListener("resize", resize))

  // INPUT HANDLING /////////////////////////////////////////////////////////////////////////////////

  let dragType: null | "cell" | "param" | "timeline" = null // null, cell, param, or timeline
  let dragParam: number | null = null // the cell idx for the currently dragged param
  let mouseStart: Record<string, number> // state captured when the mouse is first pressed
  let mouseDragged: Record<string, number> // state captured as the mouse is dragged
  let lastWaffled = performance.now()

  function pointerdown(e: PointerEvent) {
    // We assume this mouse press will result in a drag, and will cancel it if not
    window.addEventListener("pointermove", drag)

    // capture the canvas-relative position, and the offset from the window to the canvas
    mouseStart = {
      x: e.offsetX,
      y: e.offsetY,
      ox: e.clientX - e.offsetX,
      oy: e.clientY - e.offsetY,
    }

    // First, we need to figure out which region of the grid we clicked within

    // Shift mouse origin to top left of grid, divide by "enlarged" grid cells.
    // Since it includes gap, gx,gy is 0,0 at cell 0 TL and 1,1 at cell 4 TL
    let gx = (mouseStart.x - padding) / (cssW + gap)
    let gy = (mouseStart.y - padding) / (cssW + gap)

    // Get the column and row, and state (which might be null if we clicked outside the grid)
    let C = gx | 0
    let R = gy | 0
    let i = C + R * 3

    // These are normalized coords *within* the current cell — we've now carved off the gap
    let lx = ((gx - C) * (cssW + gap)) / cssW
    let ly = ((gy - R) * (cssW + gap)) / cssW

    // normalized position used by stuff in the kaoss pad
    let kx = (mouseStart.x - padding - cssW - gap) / (cssW * 2 + gap)
    let ky = ((gy - 1) * (cssW + gap)) / (cssW - clockWaveHeight - gap)

    // Update the mouse with all this extra context
    mouseStart = { ...mouseStart, C, R, i, lx, ly, kx, ky }
    mouseDragged = {
      x: e.clientX - mouseStart.ox,
      y: e.clientY - mouseStart.oy,
      dx: e.movementX,
      dy: e.movementY,
      C,
      R,
      i,
      lx,
      ly,
      kx,
      ky,
    }

    // Check if we're inside a cell
    let lxInside = lx >= 0 && lx <= 1
    let lyInside = ly >= 0 && ly <= 1

    // Check if we're inside one of the letters
    if (lxInside && lyInside && R != 1) {
      dragType = "cell"
      return
    }

    // If we're in the gap under a letter, we do selector and bail
    if (lxInside && ly > 1 && R != 1) {
      if (R > 0) i -= 3
      let s = opts.states[i]
      if (lx < 0.33) {
        const n = mod(s.i + (lx < 0.17 ? -1 : 1), opts.letterCounts[i] || 0)
        opts.set(i, "i", n)
        // reset the canvas drag position when switching letters
        opts.set(i, "x", 0)
        opts.set(i, "y", 0)
      } else if (lx > 0.95) {
        opts.edit(i)
      }

      return
    }

    // if it's in cell 3, we do ampersand stuff
    if (i == 3) {
      return
    }

    // if it's in the global kaoss pad, we find the closest draggable
    if (i == 4 || i == 5) {
      // are we dragging the time wave scrubber thingy?
      if (lyInside && ly > 0.8) {
        dragType = "timeline"
        return
      } else {
        // grab the closest waffle
        dragParam = null
        let closestDist = 0.3 // need to be within this dist for the drag to count
        for (let p = 0; p < opts.states.length; p++) {
          let s = opts.states[p]
          let dist = Math.hypot(clamp(denorm(kx)) - s.q, clamp(denorm(ky)) - s.r)
          if (dist >= closestDist) continue
          dragParam = p
          closestDist = dist
        }
        if (dragParam != null) {
          dragType = "param"
          if (performance.now() - lastWaffled < 300) {
            opts.set(dragParam, "q", dragParam / 4 - 1)
            opts.set(dragParam, "r", (Math.random() - 0.5) / 5)
          }
          lastWaffled = performance.now()
          return
        }
      }
    }

    // nothing happened, I guess — abort the drag
    pointerup()
  }

  canvas.addEventListener("pointerdown", pointerdown)
  cleanups.add(() => canvas.removeEventListener("pointerdown", pointerdown))

  const drag = (e: PointerEvent) => {
    e.preventDefault() // Prevent unwanted text selection

    // use the initial offset from the window to the canvas to compute an updated canvas-relative mouse pos
    mouseDragged = {
      x: e.clientX - mouseStart.ox,
      y: e.clientY - mouseStart.oy,
      dx: e.movementX,
      dy: e.movementY,
    }

    // Shift mouse origin to top left of grid, divide by "enlarged" grid cells.
    // Since it includes gap, gx,gy is 0,0 at cell 0 TL and 1,1 at cell 4 TL
    let gx = (mouseDragged.x - padding) / (cssW + gap)
    let gy = (mouseDragged.y - padding) / (cssW + gap)

    // These are normalized coords within the START cell
    let lx = ((gx - mouseStart.C) * (cssW + gap)) / cssW
    let ly = ((gy - mouseStart.R) * (cssW + gap)) / cssW

    // normalized position used by stuff in the kaoss pad
    let kx = (mouseDragged.x - padding - cssW - gap) / (cssW * 2 + gap)
    let ky = ((gy - 1) * (cssW + gap)) / (cssW - clockWaveHeight - gap)

    // Update the mouse with all this extra context
    mouseDragged = { ...mouseDragged, lx, ly, kx, ky }

    if (dragType == "cell") {
      let i = mouseStart.i
      if (mouseStart.R > 0) i -= 3
      opts.set(i, "x", clamp(denorm(lx)))
      opts.set(i, "y", clamp(denorm(ly)))
    } else if (dragType == "param" && dragParam != null) {
      let i = dragParam
      opts.set(i, "q", clamp(denorm(kx)))
      opts.set(i, "r", clamp(denorm(ky)))
    }
  }

  const pointerup = () => {
    dragType = null
    window.removeEventListener("pointermove", drag)
  }

  window.addEventListener("pointerup", pointerup)
  cleanups.add(() => window.removeEventListener("pointerup", pointerup))
  window.addEventListener("pointercancel", pointerup)
  cleanups.add(() => window.removeEventListener("pointercancel", pointerup))

  // DRAWING API ////////////////////////////////////////////////////////////////////////////////////

  loadFont(opts.font)

  // This is the simplified canvas API exposed to letter-drawing functions.
  // While we don't do this yet, the plan is to add instrumentation that'll feed the sound engine.
  let willFill = false
  const api = {
    newPath: true,
    ctx,

    setCtx(ctx: CanvasRenderingContext2D) {
      api.newPath = true
      api.ctx = ctx
    },

    begin(shouldFill = false) {
      api.newPath = true
      if (willFill != shouldFill) {
        willFill ? api.ctx.fill() : api.ctx.stroke()
        willFill = shouldFill
        api.ctx.beginPath()
      }
    },
    move(x = 0, y = 0) {
      activeCollector?.recordMove(x, y)
      api.ctx.moveTo(x, y)
      api.newPath = false
    },
    line(x = 0, y = 0) {
      if (api.newPath) {
        api.move(x, y)
      } else {
        activeCollector?.recordLine(x, y)
        api.ctx.lineTo(x, y)
      }
    },
    rect(x = -1, y = -1, w = 2, h = 2) {
      activeCollector?.recordRect(x, y, w, h)
      api.ctx.moveTo(x, y)
      api.ctx.rect(x, y, w, h)
      api.newPath = true
    },
    circle(x = 0, y = 0, r = 1) {
      activeCollector?.recordCircle(x, y, r)
      api.ctx.moveTo(x + r, y)
      api.arc(x, y, Math.abs(r))
      api.newPath = true
    },
    arc(x = 0, y = 0, r = 1, start = 0, end = 1, ccw = false) {
      activeCollector?.recordArc(x, y, r, start, end, ccw)
      if (api.newPath) api.move(x + r * cosn(start), y + r * sinn(start))
      api.ctx.arc(x, y, Math.abs(r), start * TAU, end * TAU, ccw)
    },
    quadratic(cx: number, cy: number, x: number, y: number) {
      // TODO: collector
      if (api.newPath) api.move(cx, cy) // this is a CHOICE, but not including it also feels like a CHOICE, ugh
      api.ctx.quadraticCurveTo(cx, cy, x, y)
    },
    cubic(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
      // TODO: collector
      if (api.newPath) api.move(cx1, cy1) // this is a CHOICE, but not including it also feels like a CHOICE, ugh
      api.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y)
    },
    text(str = "you found the rabbit egg", x = 0, y = 0, size = 2, tracking = size * 0.75) {
      // TODO: collector
      // compensate for font weirdness, so that passing 0,0 centers the first char
      x -= 0.3625 * size
      y -= 0.4 * size
      drawText(api, str.toString(), x, y, size, tracking)
      api.newPath = true
    },
    mod,
    rand,
    clamp,
    norm,
    denorm,
    renorm,
    clip,
    declip,
    cosn,
    sinn,
    rotate,
    rotaten,
    TAU,
    PI,
    mouse() {
      return !!dragType
    },
  }

  // ENGINE /////////////////////////////////////////////////////////////////////////////////////////

  // Initialize the param state for each letter
  for (let i = 0; i < 9; i++) {
    timers[i] = new Averager(10)
  }

  let mappers = Array.from(opts.word ?? "INKSWITCH")
  let lastT: number

  let stop = false
  function update(ms: number) {
    if (stop) return
    requestAnimationFrame(update)
    // the states doc isn't ready
    if (!opts.states.length) return
    if (!opts.letters.length) return
    if (document.hidden) return

    let newT = ms / 1000 / cycleTime
    lastT ??= newT
    if (dragType == "timeline") t = 0.5 + mouseDragged.kx
    else t += newT - lastT
    lastT = newT

    api.setCtx(ctx)

    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineJoin = ctx.lineCap = "round"

    let scaleFix = cssW / 200 // oops, forgot to account for this, quick hack it!

    for (let i = 0; i < 9; i++) {
      let s = opts.states[i]
      let fn = opts.letters[i]
      let C = Math.floor(i % 3)
      let _R = Math.floor(i / 3)
      let R = _R > 0 ? _R + 1 : _R
      if (!states[i]) states[i] = {}
      if (!states[i]?.[s.i]) states[i][s.i] = {}
      const state = states[i][s.i]

      // the previous letter may have turned red
      ctx.strokeStyle = color
      ctx.fillStyle = color

      // Transform to letter space
      ctx.resetTransform()
      ctx.translate(C * pixW, R * pixW) // center on the current grid cell
      ctx.translate(dpr * padding, dpr * padding) // padding
      ctx.translate(dpr * gap * C, dpr * gap * R) // gaps
      ctx.scale(pixHW, pixHW) // CLIP LETTER SPACE
      ctx.translate(1, 1) // -1 to 1
      // line width is calculated when .stroke() is called, and is affected by scale,
      // so we need to undo the effect of grid scaling (but not dpr).
      ctx.lineWidth = 2 * thick * (dpr / pixW)

      // Activate collector for this letter
      let collector = collectors[i]
      collector.reset()
      setActiveCollector(collector)

      // Draw the letter!
      let start = performance.now()
      api.newPath = true
      willFill = false
      ctx.beginPath()

      try {
        fn?.(api, { ...s, t: mod(t), s: state })
      } catch (error) {
        ctx.strokeStyle = errColor
        ctx.fillStyle = errColor
        console.error(`error in ${"INKSWiTCH"[i]}${(s.i + "").padStart(2, "0")}\n\n`, error)
      }

      willFill ? ctx.fill() : ctx.stroke()
      let cost = timers[i].add(performance.now() - start)

      // Disable collection before drawing other UI
      setActiveCollector(null)

      // AUDIO: Push drawing metrics to synth params
      const synth = synths[i]
      if (synth) {
        const c = collector
        synth.setParam(0, mod(t))
        synth.setParam(1, s.x)
        synth.setParam(2, s.y)
        synth.setParam(3, s.q)
        synth.setParam(4, s.r)
        synth.setParam(5, c.centerX)
        synth.setParam(6, c.centerY)
        synth.setParam(7, norm(c.pathLength, 0, 100))
        synth.setParam(8, norm(c.curvature, 0, 100))
        synth.setParam(9, norm(c.density, 0, 100))
        synth.setParam(10, norm(c.discontinuity, 0, 100))
        synth.setParam(11, c.directionEntropy)
        synth.setParam(12, norm(c.spreadX, 0, 1))
        synth.setParam(13, norm(c.spreadY, 0, 1))
        synth.setParam(14, c.opCount > 0 ? norm(c.circleCount + c.arcCount, 0, c.opCount) : 0)
      }

      // If the draw function took too long, apply shame
      if (cost > 3) {
        ctx.beginPath()
        ctx.lineWidth *= 3
        ctx.strokeStyle = errColor
        drawText(api, "COST : " + cost.toFixed(1) + " > 3", -1, -1, 0.15)
        ctx.stroke()
        ctx.lineWidth /= 3
      }

      if (!PRINT) {
        // Draw the letter selector
        ctx.resetTransform()
        ctx.scale(dpr, dpr) // SCREEN SPACE
        ctx.translate(C * cssW, R * cssW) // center on the current grid cell
        ctx.translate(padding, padding) // padding
        ctx.translate(gap * C, gap * R) // gaps
        ctx.lineWidth = thick
        {
          let charWidth = 10 * scaleFix
          let charHeight = 11 * scaleFix // this font is weird
          let labelText = mappers[i] + opts.states[i].i.toString().padStart(2, "0")
          let labelWidth = charWidth * labelText.length
          let x = 17 * scaleFix + labelWidth / 2
          let y = cssW + gap / 2
          ctx.beginPath()
          drawText(api, labelText, x - labelWidth / 2, y - scaleFix - charHeight / 2, 16 * scaleFix, charWidth)
          api.move(x - 26 * scaleFix, y - charHeight / 2)
          api.line(x - 32 * scaleFix, y + 0)
          api.line(x - 26 * scaleFix, y + charHeight / 2)
          api.move(x + 26 * scaleFix, y - charHeight / 2)
          api.line(x + 32 * scaleFix, y + 0)
          api.line(x + 26 * scaleFix, y + charHeight / 2)
          ctx.stroke()

          // edit & fork
          ctx.beginPath()
          api.circle(cssW - 6 * scaleFix, y, 6 * scaleFix)
          if (opts.currentlyEditingIndex == i) ctx.fill()
          else ctx.stroke()
        }
      }

      // Update the current synth
      let idx = opts.currentlyEditingIndex
      if (idx != null && synthEditor && synths[idx]) {
        const synth = synths[idx]
        if (idx != lastCurrentlyEditing) {
          synthEditor.value = loadSynthText(idx)
          // for (let s = 0; s < 15; s++) Spark.reset(idx)
          idx = lastCurrentlyEditing
        }
        for (let s = 0; s < 15; s++) Spark.add(s, synth.params[s], paramNames[s])
        Spark.tick(api)
        api.setCtx(ctx) // spark sets its own api ctx (ugh this is so nasty)
      }

      // Draw the kaoss pad draggable
      ctx.resetTransform()
      ctx.translate(pixW, pixW) // origin at the TL corner of the kaoss pad
      ctx.translate(dpr * padding, dpr * padding) // padding
      ctx.translate(dpr * gap, dpr * gap) // gaps
      ctx.scale(pixW, pixW) // NORM LETTER SPACE
      ctx.lineWidth = thick * (dpr / pixW)

      // kaoss pad is x: 0-2, y: 0-1
      ctx.beginPath()
      let gs = 0.025 // size of the grid
      // m rows by n cols
      for (let m = 0; m < 3; m++) {
        for (let n = 0; n < 3; n++) {
          let W = 2 + gap / cssW - gs * 3
          let H = 1 - (clockWaveHeight * scaleFix + gap) / cssW - gs * 3
          let X = gs * n + declip(s.q, 0, W)
          let Y = gs * m + declip(s.r, 0, H)
          if (m * 3 + n == i) ctx.fillRect(X, Y, gs, gs)
          api.rect(X, Y, gs, gs)
        }
      }
      ctx.stroke()
    }

    // DAWN OF THE SECOND ROW

    // &
    ctx.resetTransform()
    ctx.translate(0, pixW) // center on the current grid cell
    ctx.translate(dpr * padding, dpr * padding) // padding
    ctx.translate(0, dpr * gap) // gaps
    ctx.scale(pixHW, pixHW) // CLIP LETTER SPACE
    ctx.translate(1, 1) // -1 to 1
    ctx.lineWidth = 2 * thick * (dpr / pixW)
    ctx.strokeStyle = color

    {
      let r = 0.3
      ctx.beginPath()
      api.arc(0, -0.5, r, 0, -0.25, true)
      api.arc(-0.75, -0.5, r, -0.25, 0.25, true)
      api.line(-0.6, -0.2)
      api.move(-0.6, -0.1)
      api.arc(-0.75, 0.2, r, -0.25, -0.5, true)
      api.arc(-0.75, 0.8, r, 0.5, 0.25, true)
      api.arc(0.5, 0.8, r, 0.25, 0, true)
      api.line(0.8, 0.5)
      api.line(0.8 - 0.8, 0.5 + 0.1)
      api.move(0.8, 0.5)
      api.line(0.8 + 0.8, 0.5 - 0.1)
      ctx.stroke()

      ctx.beginPath()
      api.circle(0.8, 0.5, 0.04)
      ctx.fill()
    }

    // Clock wave
    ctx.resetTransform()
    ctx.scale(dpr, dpr) // SCREEN SPACE
    ctx.translate(padding, padding) // padding
    ctx.translate(gap + cssW, cssW + gap + cssW) // 0,0 at the BL corner of the kaoss pad
    ctx.lineWidth = thick
    for (let i = 0; i <= 1.0001; i += 0.02) {
      ctx.beginPath()
      let phase = (((i - t + 0.5) % 1) + 1) % 1 // 0 to 1
      let p = Math.abs(denorm(phase)) // 1 to 0 to 1
      p **= 2.5
      ctx.lineWidth = denorm(Math.min((1 - Math.abs(denorm(i))) * 4, 1) * p, 0.5, 5)
      let x = cssW * i * 2 + gap * i
      ctx.moveTo(x, -clockWaveHeight * scaleFix)
      ctx.lineTo(x, 0)
      ctx.stroke()
    }
  }

  async function setupAudio() {
    let { context, input } = await setupContext()

    // Create 9 synths with drawing-reactive patches
    const drawingPatches = [patches.reactiveVoice, patches.drawingDrone, patches.percussiveInk, patches.directionBell]
    for (let i = 0; i < 9; i++) {
      let synth = new Synth(context, drawingPatches[i % drawingPatches.length])
      synth.synth.connect(input)
      synths.push(synth)
      setSynthPatch(i, loadSynthText(i))
      synth.setMessageField(messageField) // this is fine — only the active one will write
      synth.noteOn(48)
    }

    synthEditor.value = loadSynthText(opts.currentlyEditingIndex ?? 0)
    synthEditor.oninput = () => updateCurrentSynth(synthEditor.value)
    updateCurrentSynth(synthEditor.value)
  }

  // Audio context requires user gesture to start
  if (useAudio) window.addEventListener("pointerdown", setupAudio, { once: true })

  // INIT
  Spark.setup()
  requestAnimationFrame(update)

  return function cleanup() {
    console.log("CLEANUP")
    stop = true
    for (const fn of cleanups) fn()
  }
}
