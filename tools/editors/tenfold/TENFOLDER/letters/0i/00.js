// (You're looking at the code for the letter "I" at the top left.)
// (When making a letter, you can name it and name it…)

// Example I
// by Ivan

// params.t is "time"
// starts at 0, rises slowly to 1, then resets back to 0
let t = params.t // 0 to 1

// sinn() takes a number between 0 and 1 ("normalized")
// and returns a sine wave between -1 and 1 ("clip")
let sineWave = cosn(params.t)

// declip() takes a number between -1 and 1,
// and scales that number so it falls proportionally
// between the latter two values.
let size = declip(sineWave, 1.9, 2.0)

// Render the letter "I".
// The x/y params let you move the letter by dragging on it.
// The size will cycle slowly between 1.9 and 2.0
text("I", params.x, params.y, size)
