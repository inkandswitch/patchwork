# Welcome to Tenfold

Read this guide to learn the ropes,
or just start clicking around and hope
for the best :D

## <1 • The Human Element>

If you're unsure what to do,
please let us help you!

Post questions in the `#tenfold` channel.
Hang out in the `#FOLDNET` channel.

To make letters, you need to use JavaScript.
If you've never written JavaScript before,
Tenfold would be a lovely way to try it.

## <2 • The Graphical User Interface>

To the left are nine letters
with a central control area.

Here on the right is this readme
and, soon, computer code to edit.

A low-res screenshot of Tenfold:

```
I N K ………
& === ………
S W I [#=]
T C H [I]
```

Zoom in on the letter "I":

```
IIIIIIII
   II
   II
   II
IIIIIIII
<I00>  o
```

`<I00>` flips through variations of the letter.
`o` flips between the code and these docs.

Click and drag on the letter and,
if the code was written just so,
it might do something.
(Might not though.)

Zoom in on the second row:

```
   __
 /    \   #     #           #
 \_          #    #      #    #
 /                  #   #
|    __--
 \____/  ||||||||||||||||||||||
```

The ampersand is inert. It holds place.

To the right, a space for waffles.
Each waffle belongs to one letter.
You can click and drag a waffle and,
if the code was written just so,
the letter might do something.
(Might not though.)

Below the waffles is the `time wave`.
Click and drag to…ot gard dna kcilC

## <3 • Drawing with Code>

Drawing is the art of mark-making,
and the following functions are how
you make your mark with computer code.

These are the _creative constraints_ of Tenfold.

If there's something you want to do,
the challenge is to figure out how
to do it with just these tools.

### Space

Each letter occupies space,
and we measure the space with coordinates.

You'll find 0,0 - the origin - at the center.

Negatives are up and left.
Positives are right and down.

Some of my favourite positions:

```
-1,-1 --------- +1,-1
|         |         |
|         |         |
|        0,0        |
|         |         |
|         |         |
-1,+1 --------- +1,+1
<H00>               o
```

### Lines

#### `line(x, y)`

This code lets you draw a line.
Call it once to set the start point.
Call it again to draw a line
from the last point to the new one.

#### `begin()`

Call this function when you'd like
to begin drawing a new line.

The next time you call `line(x, y)`,
it'll place the start point.

#### `move(x, y)`

This is the same as `begin()` then `line(x, y)`.

### Shapes

#### `rect(x, y, width, height)`

A rectangle drawn from its top left.
Width and height can be negative.

#### `circle(x, y, radius)`

A special ring within which you summon
your resolve and dispel dissonance.

#### `text(string, x, y, size)`

Draw the given string of letters.
Use "\n" for newlines.

If you don't pass x, y, or size, the text will appear just above your letter. Handy for debugging.

## <4 • Parameters>

There are three kinds of parameters you can use to make your letter animated and interactive. It's recommended that you find a way to use all three, since that'll make your letter maximally playful - even something trivial is fine.

### Time

All the letters share a `params.t` value representing the current time. This value slowly rises from 0 to 1, looping back to 0 every few seconds. You can use this value to animate your letter by making some part of the drawing change as `params.t` changes. For instance, to make your letter appear to shuffle from side to side, you can multiply some `x` values by `sin(params.t * TAU)`.

### Waffles

Each letter is controlled by a draggable handle that happens to look like a waffle. The variables `params.q` & `params.r` represent the horizontal & vertical position of the waffle, and both range from -1 to 1 (left/top to right/bottom).

### Prodding

You can also poke directly at letters using your mouse. When a letter is poked (ie: dragged), the position of the mouse is available as variables `params.x` & `params.y`, both ranging from -1 to 1.

## <5 • Common Ranges>

When working with the drawing functions and parameters described above, and the helper functions described below, you'll notice that they're all designed to work with values from -1 to 1 or 0 to 1. These particular ranges are really, really useful, so we're going to give them names to make it easier to talk about them.

### -1 to 1 - "Clip"

Each of the letters is drawn inside a little square. X/Y positions inside the square range from -1 at the left & top edges, to +1 at the right & bottom edges. We refer to positions between -1 and +1 as existing in "clip space" - if it helps, imagine that these letters are being "clipped" for a ransom note with scissors.

One nice thing about "clip space" is you don't have to think about how big the letter is - there are no pixels here. Another benefit is that position 0,0 is at the center of the letter - nice for symmetry.

### 0 to 1 - "Norm"(alized)

Some values, like the `start` and `end` used for arcs and `params.t` for time, are "normalized", which means they range from 0 to 1. But "normalized" is exhausting, so we often abbreviate this as "norm". So if you ever see "norm", know that it just means "0 to 1".

Here's a nice thing that combines both of the above: `circle(0, 0, 1)` gives you a circle at the center of the letter that extends exactly to the edge of its grid square.

## <6 • Math(s)>

One slightly math-y thing about clip and norm: numbers between -1 and 1 behave in stable, predictable ways when multiplied. You can multiply a bunch of clip/norm values together and they'll remain clip/norm. That's nice.

In Tenfold, we've done `with(Math)` so you can just say `max(a,b)` instead of `Math.max(a,b)`, or `PI` instead of `Math.PI`, etc.

In addition to the standard Math functions and constants, here are a handful of extra math functions you can use. You'll notice that many of them are designed to work with clip or norm values by default.

### Range Conversions

#### `norm(v, lo = -1, hi = 1)`

Takes a value that ranges from lo to hi, and remaps it to the range 0 to 1.

#### `clip(v, lo = -1, hi = 1)`

Takes a value that ranges from lo to hi, and remaps it to the range -1 to 1.

#### `denorm(v, lo = -1, hi = 1)`

Takes a value that ranges from 0 to 1, and remaps it to the range lo to hi.
This is also known as 'lerp' (though with a different argument order).

#### `declip(v, lo = 0, hi = 1)`

Takes a value that ranges from -1 to 1, and remaps it to the range lo to hi.

### Range Manipulation

For the above functions, if you pass values that extend beyond the input range they'll be remapped proportionally. If you don't want that, use the following:

#### `clamp(v, lo = -1, hi = 1)`

Limits a value to be between lo and hi.

#### `renorm(v, lo = -1, hi = 1, LO = -1, HI = 1, doClamp = false)`

This function combines all the above.
Takes a value that ranges from lo to hi, and remaps it to the range LO to HI.
If doClamp is true, the result will be clamped to the range LO to HI.

### Misc

#### `TAU`

Equivalent to 2 \* PI

#### `sinn(v)` / `cosn(v)`

Sine and cosine that take a normalized angle, which you can think of as "full turns"

#### `rand(lo = -1, hi = 1)`

Returns a random number between lo and hi

#### `mod(v, d = 1)`

Gives you the remainder when v is divided by d, with different handling of negatives than the common `%` operator. This difference makes `mod()` useful for creating cycling patterns because it doesn't 'mirror' the pattern across 0.

#### `rotate(x, y, turns, px = 0, py = 0) => {x,y}`

Rotate point x,y around pivot point px,py by a given number of turns.
1 turn is equivalent to 360º or 2π radians.
Returns an object with the x,y of the rotated point.

## <7 • Conclusion>

Thanks for joining our communal art project,
and celebrating ten years of Ink & Switch.
We can't wait to see what you dream up.

Credits:

- Todd Matthews - conceptual and graphic design
- chee rabbits - patchwork tools, system design
- Ivan Reese - api design, implementation, docs
- Everyone - feedback, letters, patchwork, <333
