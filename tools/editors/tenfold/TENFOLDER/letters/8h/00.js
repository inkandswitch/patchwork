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
const weight = 1

let grid = [
  ...Array(serifs).fill(serif),
  ...Array(distan).fill(pillars),
  ...Array(1).fill(bridgecap),
  ...Array(1).fill(bridge),
  ...Array(distan).fill(pillars),
  ...Array(1).fill(bserif),
];

let offsets = [-0.75, -0.75]
let width = 0.2
let height = 0.2

let radius = 0.2

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

let shapes = {
  1: (x, y) => scribble(x-0.02, y-0.02, abs(radius), 4),
  2: (x, y) => topTriangle(x-0.02, y-0.02, radius, 4),
  3: (x, y) => botTriangle(x-0.02, y-0.02, abs(radius), 4),
  4: (x, y) => topTriangle(x+width-0.02, y+height-0.02, -radius, 4),
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
