// Types shared across control surface modules.
// HitResult mirrors the shape returned by hitCoords() in tenfold.ts.

export interface HitResult {
  gx: number
  gy: number
  C: number
  R: number
  i: number
  li: number
  lx: number
  ly: number
  kx: number
  ky: number
  lxInside: boolean
  lyInside: boolean
  inside: boolean
}

export interface Region {
  cursor?: string | ((h: HitResult) => string)
  test(h: HitResult): boolean
  pointerdown?(h: HitResult): void | false
  drag?(start: HitResult, h: HitResult, lx?: number, ly?: number): void
  frame?(): void
}

export interface DrawAPI {
  ctx: CanvasRenderingContext2D
  setCtx(ctx: CanvasRenderingContext2D): void
  newPath: boolean
  move(x: number, y: number): void
  line(x: number, y: number): void
  rect(x: number, y: number, w: number, h: number): void
  circle(x: number, y: number, r: number): void
  arc(x: number, y: number, r: number, start?: number, end?: number, ccw?: boolean): void
}

// Context passed to every control module. Getters for measurements that change on resize.
// opts is a live reactive reference.
export interface ControlCtx {
  ctx: CanvasRenderingContext2D
  api: DrawAPI
  getPixW(): number
  getPixHW(): number
  getCssW(): number
  getDpr(): number
  thick: number
  color: string
  // Layout constants — outer grid dimensions are fixed; row 2 values are tunable
  padding: number
  gap: number
  pitch: number
  waffleEnd: number    // ly where waffle pad ends
  controlsStart: number // ly where controls strip begins (below waffles)
  controlsEnd: number  // ly where controls strip ends (= 1.0, bottom of cell)
  opts: {
    states: Array<{ q: number; r: number; i: number; x: number; y: number }>
    set(i: number, field: "q" | "r" | "x" | "y" | "i", val: number): void
  }
  getMouseDragged(): Record<string, number>
}
