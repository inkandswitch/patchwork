import { drawText } from "./font.ts"
import { renormalized, roundTo } from "./Math.ts"

const maxSparks = 15

const limit = 200
const height = 50

let xScale = 1
let width = limit * xScale

const sparks: Spark[] = []
type Spark = {
  minV: number
  maxV: number
  values: Value[]
  label: string
}

type Value = number

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
const dpr = window.devicePixelRatio

function setup() {
  canvas = document.querySelector("#spark") as HTMLCanvasElement
  let bounds = canvas.getBoundingClientRect()
  canvas.width = bounds.width * dpr
  canvas.height = bounds.height * dpr

  width = bounds.width / maxSparks
  xScale = width / limit

  ctx = canvas.getContext("2d")!
  ctx.scale(dpr, dpr)
  ctx.lineWidth = 1
}

// `value` should be normalized (or at least close-ish)
function add(i: number, v: number, label = "", minV = Infinity, maxV = -Infinity) {
  const spark = (sparks[i] ??= { values: [], minV, maxV, label })
  spark.label = label
  spark.minV = Math.min(v, spark.minV)
  spark.maxV = Math.max(v, spark.maxV)
  spark.values.unshift(v)
  if (spark.values.length > limit + 1) spark.values.pop()
}

export const reset = (i: number) => {
  if (!sparks[i]) return
  sparks[i].values = []
}

function tick(api: any) {
  if (sparks.length === 0) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  api.setCtx(ctx)

  for (let pos = 0; pos < sparks.length; pos++) {
    let { minV, maxV, values, label } = sparks[pos]
    let x = pos * width
    // legend
    ctx.beginPath()
    ctx.strokeStyle = "#fff"
    drawText(api, roundTo(maxV, 0.1) + " " + label, x, 1, 8, 5)
    drawText(api, roundTo(minV, 0.1) + "", x + 1, height - 8, 8)
    ctx.stroke()
    // Draw the sparkline
    ctx.beginPath()
    ctx.setLineDash([])
    ctx.strokeStyle = "#fff"
    for (let i = 1; i < values.length; i++) {
      let a = values[i - 1]
      let b = values[i - 0]
      ctx.moveTo(x + xScale * (i - 1), renormalized(a, minV, maxV, height - 10, 10))
      ctx.lineTo(x + xScale * (i - 0), renormalized(b, minV, maxV, height - 10, 10))
    }
    ctx.stroke()
  }
}

export default { add, tick, setup, reset }
