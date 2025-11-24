// with Math
declare const PI: typeof Math.PI;
declare const TAU: typeof Math.PI;
declare const abs: typeof Math.abs;
declare const acos: typeof Math.acos;
declare const acosh: typeof Math.acosh;
declare const asin: typeof Math.asin;
declare const asinh: typeof Math.asinh;
declare const atan: typeof Math.atan;
declare const atan2: typeof Math.atan2;
declare const atanh: typeof Math.atanh;
declare const ceil: typeof Math.ceil;
declare const cos: typeof Math.cos;
declare const cosh: typeof Math.cosh;
declare const exp: typeof Math.exp;
declare const floor: typeof Math.floor;
declare const hypot: typeof Math.hypot;
declare const log: typeof Math.log;
declare const log10: typeof Math.log10;
declare const log1p: typeof Math.log1p;
declare const log2: typeof Math.log2;
declare const max: typeof Math.max;
declare const min: typeof Math.min;
declare const pow: typeof Math.pow;
declare const random: typeof Math.random;
declare const round: typeof Math.round;
declare const sign: typeof Math.sign;
declare const sin: typeof Math.sin;
declare const sinh: typeof Math.sinh;
declare const sqrt: typeof Math.sqrt;
declare const tan: typeof Math.tan;
declare const tanh: typeof Math.tanh;

declare function cosn(v: number): number;
declare function sinn(v: number): number;

/**
 * You'll call this function multiple times to draw a line.
 * The first time you call it, that's where the line starts.
 * Each following call will draw a line from the previous point
 * to the newly given point.
 */
declare function line(x: number, y: number): void;

// Call this function when you'd like to begin drawing another line.
declare function begin(): void;

// You can also begin a new line at a point.
// This is equivalent to calling begin() then line(x, y) once.
declare function move(x: number, y: number): void;

// SHAPES

// A rectangle with the top left corner at x,y.
// Width and height can be negative.
declare function rect(
  x: number,
  y: number,
  width: number,
  height: number
): void;

// A special ring within which you summon your resolve and dispel dissonance
declare function circle(x: number, y: number, radius: number): void;

// Draw the given string using our special pen-plotter font.
// Use "\n" for newlines.
declare function text(
  string: string,
  x?: number,
  y?: number,
  size?: number,
  tracking?: number
): void;

interface params {
  q: number;
  r: number;
  t: number;
  x: number;
  y: number;
}

declare const params: params;

// The following curve-drawing functions will continue the current line,
// but unlike line() you can't use them to specify where a new line starts,
// so if you're beginning a new line with a curve then call move() first.

// Draw an arc along a circle centered at the given position.
// Start/end are "normalized" — 0 is the rightmost point on the circle,
// increasing as you go clockwise (or counterclockwise if you want),
// with 0.5 at the leftmost and then 1 at the rightmost again.
declare function arc(
  x: number,
  y: number,
  radius: number,
  start?: number,
  end?: number,
  counterclockwise?: boolean
);

// Draw a quadratic bezier curve from the previous line
// to position x,y, using cx,cy as a control point to bend the curve.
declare function quadratic(cx: number, cy: number, x: number, y: number);

// Draw a cubic bezier curve from the current line position
// to position x,y, using two control points to bend the curve.
declare function cubic(
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x: number,
  y: number
);

// RANGE CONVERSIONS

// Takes a value that ranges from lo to hi, and remaps it to the range 0 to 1.
declare function norm(v: number, lo?: number, hi?: number): number;

// Takes a value that ranges from lo to hi, and remaps it to the range -1 to 1.
declare function clip(v: number, lo?: number, hi?: number): number;

// Takes a value that ranges from 0 to 1, and remaps it to the range lo to hi.
// This is also known as 'lerp' (though with a different argument order).
declare function denorm(v: number, lo?: number, hi?: number): number;

// Takes a value that ranges from -1 to 1, and remaps it to the range lo to hi.
declare function declip(v: number, lo?: number, hi?: number): number;

// RANGE MANIPULATION

// For the above functions, if you pass values that extend beyond the
// input range they'll be remapped proportionally. If you don't want that,
// use the following, which limits a value to be between lo and hi.
declare function clamp(v: number, lo?: number, hi?: number): number;

// This function combines all the above.
// Takes a value that ranges from lo to hi, and remaps it to the range LO to HI.
// If doClamp is true, the result will be clamped to the range LO to HI.
declare function renorm(
  v: number,
  lo?: number,
  hi?: number,
  LO?: number,
  HI?: number,
  doClamp?: boolean
);

// MISC

// Returns a random number between lo and hi
declare function rand(lo?: number, hi?: number): number;

// Gives you the remainder when v is divided by d,
// with different handling of negatives than the common `%` operator.
// This difference makes `mod()` useful for creating cycling patterns
// because it doesn't 'mirror' the pattern across 0.
declare function mod(v, d?: number): number;

interface point {
  x: number;
  y: number;
}

// Rotate point x,y around pivot point px,py by a given number of turns.
// 1 turn is equivalent to 360º or π radians.
// Returns an object with the x,y of the rotated point.
declare function rotate(
  x: number,
  y: number,
  turns: number,
  px = 0,
  py = 0
): point;
