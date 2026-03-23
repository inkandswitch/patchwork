// author: pvh + june
// specific grid-based shape drawing

let serif =    [3, 1, 0, 0, 1, 2]
let pillars =  [0, 1,  0, 0, 1, 0]
let bridgecap =  [0, 1, 1, 1, 1, 0]
let bridge =   [0, 1, 1, 1, 1, 0, 0]
let bserif =    [3, 1, 0, 0, 1, 2]

const rot = (a, n) => [...a.slice(a.length -n, a.length), ...a.slice(0, a.length -n)]

const serifs = 1
const distan = 2

let grid = [
  ...Array(serifs).fill(serif),
  ...Array(distan).fill(pillars),
  ...Array(1).fill(bridgecap),
  ...Array(1).fill(bridge),
  ...Array(distan).fill(pillars),
  ...Array(1).fill(bserif),
];

let width = declip(params.y, .15, .25)
let height = declip(params.x, .1, .3)
let offsets = [-params.y/4-.75, -params.x/3-.75]

let radius = declip(params.q, 0, 0.2)

const topTriangle = (x, y, w, c) => {
  move(x, y);
  [...Array(c)].map((_,i)=>(i/c)*w).forEach(d => {
    line(x, y+d)
    line(x+d, y)
  });
}
const botTriangle = (x, y, w, c) => {
  move(x+w, y);
  [...Array(c)].map((_,i)=>(i/c)*w).forEach(d => {
    line(x+d, y+w)
    line(x+w, y+d)
  });
}

const scribble = (x, y, w, c) => {
  move(x, y);
  [...Array(c)].map((_,i)=>(i/c)*w).forEach(d => {
    line(x, y+d)
    line(x+d, y)
  });
  
  [...Array(c)].map((_,i)=>(i/c)*w).forEach(d => {
    line(x+d, y+w)
    line(x+w, y+d)
  })

}

let cnt = 1 + round(params.t * 5)

let shapes = {
  1: (x, y) => scribble(x, y, abs(radius), cnt),
  2: (x, y) => topTriangle(x, y, radius, cnt),
  3: (x, y) => botTriangle(x, y, abs(radius), cnt),
  4: (x, y) => topTriangle(x+width, y+height, -radius, cnt),
}

// remember loops
for (let row = 0; row < grid.length; row++) {
  for (let column = 0; column < grid[row].length; column++) {
    if(grid[row][column] in shapes) {
      let x = (column * height) + offsets[1]
      let y = (row * width) + offsets[0]
      shapes[grid[row][column]](x, y)
    }
  }
}
