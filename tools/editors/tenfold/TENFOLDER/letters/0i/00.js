// Welcome to THE NEW AND IMPROVED Tenfold!!

// Here's a big ugly URL to the readme to help you get started:
// https://tiny.patchwork.inkandswitch.com/#doc=3AHe4jK4qZDk49tvB68drsy63b88


// 🐈‍⬛ BIG SCARY WARNING!! 🐈‍⬛
// All code is editable by anyone, and automatically synced!
// Try not to mess with existing letters. Instead, you can
// click the "F" at the top to fork this letter so you can edit it.
// NB: there's no visual feedback when you fork, so only click once!

// This is a highly social activity.
// If you're not sure what to do, ask!
// Post questions in the #tenfold channel
// Hang out in the 10F𒓎𒔱𒔺𒂟𒀭𒀪 channel

/////////////////////////////////////////////////////////////////////

// (You're looking at the code for the letter "I" at the top left.)
// (When making a letter, you can name it and name it…)

// Example I
// by Ivan

// params.t starts at 0, rises slowly to 1, then resets back to 0
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

