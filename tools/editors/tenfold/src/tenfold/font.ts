const chars: Record<string, { x: number; y: number }[][]> = {}

let paths = []
let path = []

export function loadFont(font: string) {
  let current: string | null = null

  for (let line of font.split("\n")) {
    line = line.trim()
    if (!line) continue

    if (line.startsWith("StartChar")) {
      current = line.split(" ")[1].trim()
      paths = chars[current] = []
    } else if (line === "EndChar") {
      current = null
    } else if (current) {
      const m = line.match(/^(\d+)\s+(\d+)\s+m$/)
      const l = line.match(/^(\d+)\s+(\d+)\s+l$/)

      if (m) {
        path = [{ x: +m[1], y: +m[2] }]
        paths.push(path)
      } else if (l) {
        path.push({ x: +l[1], y: +l[2] })
      }
    }
  }
}

export function drawText(api: any, str: string, x = 0, y = 0, size = 2, tracking = size * 0.75) {
  let _x = x
  for (let c of Array.from(str)) {
    // perform a newline
    if (c == "\n") {
      y += size
      x = _x
      continue
    }
    // render non-whitespace chars
    if (c != " ") {
      let char = chars[c] ?? chars["?"]
      for (let path of char) {
        api.newPath = true
        for (let p of path) {
          let X = x + (p.x * size) / 800
          let Y = y + size - (p.y * size) / 800 // y is flipped
          api.line(X, Y)
        }
      }
    }
    // advance
    x += tracking
  }
}
