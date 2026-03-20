export default function TenfoldDocs() {
  return (
    <div class="tenfold-docs">
      <h1>Tenfold - Read Me First</h1>

      <p>Welcome to Tenfold! Read this guide to learn the ropes… or just start clicking around and hope for the best. You know, the usual computer stuff.</p>

      <h2>User Interface</h2>

      <p>On the left you'll see a live preview of 9 letters and a medial control area, and on the right there's these docs and a code editor (currently hidden).</p>

      <p>Here's a low-res screenshot:</p>

      <pre>{`| I N K | ………… |
| & # # | …    |
| S W I | ………  |
| T C H | ……   |`}</pre>

      <p>Here's a high-res low-res screenshot of the letter "I":</p>

      <pre>{`////////
   //
   //
////////
<I00>  o`}</pre>

      <p>
        At the bottom left of the letter is <code>{"<I00>"}</code>, which you can click to cycle through all the different versions of this letter. At the bottom right is{" "}
        <code>o</code>, a little radio button, which lets you toggle between editing a letter and reading these docs.
      </p>

      <h2>Drawing with Code</h2>

      <p>
        Drawing is the art of mark-making, and the following functions are how you'll make your marks on the screen. These functions are also the main <em>creative constraints</em>{" "}
        in this project, simultaneously limiting and enabling how you express yourself. If there's something you want to do, the challenge is to figure out how to do it with just
        these tools. Good luck, godspeed, get help if you're stumped!
      </p>

      <pre>{`// LINES

// You'll call this function multiple times to draw a line.
// The first time you call it, that's where the line starts.
// Each following call will draw a line from the previous point
// to the newly given point.
line(x, y)

// Call this function when you'd like to begin drawing another line.
begin()

// You can also begin a new line at a point.
// This is equivalent to calling begin() then line(x, y) once.
move(x, y)

// SHAPES

// A rectangle with the top left corner at x,y.
// Width and height can be negative.
rect(x, y, width, height)

// A special ring within which you summon your resolve and dispel dissonance
circle(x, y, radius)

// Draw the given string using our special pen-plotter font.
// Use "\\n" for newlines.
text(string, x, y, size, tracking = size * 0.75)

// CURVES

// Draw an arc along a circle centered at the given position.
// Start/end are "normalized" - 0 is the rightmost point on the circle,
// increasing as you go clockwise (or counterclockwise if you want),
// with 0.5 at the leftmost and then 1 at the rightmost again.
arc(x, y, radius, start = 0, end = 1, counterclockwise = false)

// Draw a quadratic bezier curve from the previous line
// to position x,y, using cx,cy as a control point to bend the curve.
quadratic(cx, cy, x, y)

// Draw a cubic bezier curve from the current line position
// to position x,y, using two control points to bend the curve.
cubic(cx1, cy1, cx2, cy2, x, y)`}</pre>

      <h2>Parameters</h2>

      <p>
        There are three kinds of parameters you can use to make your letter animated and interactive. It's recommended that you find a way to use all three, since that'll make your
        letter maximally playful - even something trivial is fine.
      </p>

      <h4>Time</h4>
      <p>
        All the letters share a <code>params.t</code> value representing the current time. This value slowly rises from 0 to 1, looping back to 0 every few seconds. You can use
        this value to animate your letter by making some part of the drawing change as <code>params.t</code> changes. For instance, to make your letter appear to shuffle from side
        to side, you can multiply some <code>x</code> values by <code>sin(params.t * TAU)</code>.
      </p>

      <h4>Waffles</h4>
      <p>
        Each letter is controlled by a draggable handle that happens to look like a waffle. The variables <code>params.q</code> &amp; <code>params.r</code> represent the horizontal
        &amp; vertical position of the waffle, and both range from -1 to 1 (left/top to right/bottom).
      </p>

      <h4>Prodding</h4>
      <p>
        You can also poke directly at letters using your mouse. When a letter is poked (ie: dragged), the position of the mouse is available as variables <code>params.x</code>{" "}
        &amp; <code>params.y</code>, both ranging from -1 to 1.
      </p>

      <h2>Common Ranges</h2>

      <p>
        When working with the drawing functions and parameters described above, and the helper functions described below, you'll notice that they're all designed to work with
        values from -1 to 1 or 0 to 1. These particular ranges are really, really useful, so we're going to give them names to make it easier to talk about them.
      </p>

      <h4>-1 to 1 - "Clip"</h4>
      <p>
        Each of the letters is drawn inside a little square. X/Y positions inside the square range from -1 at the left &amp; top edges, to +1 at the right &amp; bottom edges. We
        refer to positions between -1 and +1 as existing in "clip space" - if it helps, imagine that these letters are being "clipped" for a ransom note with scissors.
      </p>

      <p>
        One nice thing about "clip space" is you don't have to think about how big the letter is - there are no pixels here. Another benefit is that position 0,0 is at the center
        of the letter - nice for symmetry.
      </p>

      <h4>0 to 1 - "Norm"(alized)</h4>
      <p>
        Some values, like the <code>start</code> and <code>end</code> used for arcs and <code>params.t</code> for time, are "normalized", which means they range from 0 to 1. But
        "normalized" is exhausting, so we often abbreviate this as "norm". So if you ever see "norm", know that it just means "0 to 1".
      </p>

      <p>
        Here's a nice thing that combines both of the above: <code>circle(0, 0, 1)</code> gives you a circle at the center of the letter that extends exactly to the edge of its
        grid square.
      </p>

      <h2>Math</h2>

      <p>
        One slightly math-y thing about clip and norm: numbers between -1 and 1 behave in stable, predictable ways when multiplied. You can multiply a bunch of clip/norm values
        together and they'll remain clip/norm. That's nice.
      </p>

      <p>
        In Tenfold, we've done <code>with(Math)</code> so you can just say <code>max(a,b)</code> instead of <code>Math.max(a,b)</code>, or <code>PI</code> instead of{" "}
        <code>Math.PI</code>, etc.
      </p>

      <p>
        In addition to the standard Math functions and constants, here are a handful of extra math functions you can use. You'll notice that many of them are designed to work with
        clip or norm values by default.
      </p>

      <pre>{`// RANGE CONVERSIONS

// Takes a value that ranges from lo to hi, and remaps it to the range 0 to 1.
norm(v, lo = -1, hi = 1)

// Takes a value that ranges from lo to hi, and remaps it to the range -1 to 1.
clip(v, lo = -1, hi = 1)

// Takes a value that ranges from 0 to 1, and remaps it to the range lo to hi.
// This is also known as 'lerp' (though with a different argument order).
denorm(v, lo = -1, hi = 1)

// Takes a value that ranges from -1 to 1, and remaps it to the range lo to hi.
declip(v, lo = 0, hi = 1)

// RANGE MANIPULATION

// For the above functions, if you pass values that extend beyond the
// input range they'll be remapped proportionally. If you don't want that,
// use the following, which limits a value to be between lo and hi.
clamp(v, lo = -1, hi = 1)

// This function combines all the above.
// Takes a value that ranges from lo to hi, and remaps it to the range LO to HI.
// If doClamp is true, the result will be clamped to the range LO to HI.
renorm(v, lo = -1, hi = 1, LO = -1, HI = 1, doClamp = false)

// MISC

// Equivalent to 2 * PI
TAU

// Sine and cosine that take a normalized angle,
// which you can think of as "full turns"
sinn(v) // equivalent to sin(v * TAU)
cosn(v) // equivalent to cos(v * TAU)

// Returns a random number between lo and hi
rand(lo = -1, hi = 1)

// Gives you the remainder when v is divided by d,
// with different handling of negatives than the common \`%\` operator.
// This difference makes \`mod()\` useful for creating cycling patterns
// because it doesn't 'mirror' the pattern across 0.
mod(v, d = 1)

// Rotate point x,y around pivot point px,py by a given number of turns.
// 1 turn is equivalent to 360º or 2π radians.
// Returns an object with the x,y of the rotated point.
rotate(x, y, turns, px = 0, py = 0) => {x,y}`}</pre>

      <h2>Tips &amp; Tricks</h2>

      <pre>{`// FASTER ANIMATIONS
// Multiply params.t by whole numbers, and then mod by 1 (the default).
// This makes time cycle faster while still looping seamlessly.
let fastT = mod(params.t * 4)

// SHIFTED ANIMATIONS
// Add a small offset to params.t, then mod by 1 (the default).
// This makes your animation restart a little before or after other letters.
// In general, try to make sure your letter looks "good" when params.t is 0,
// because that's probably how it'll look when printed on a shirt.
let shiftedT = mod(params.t + .5)

// CURVED NUMBERS
// If you have a normalized value (\`v\` in these examples),
// you can "curve" or "bend" this value using an exponent.
let indolentV = v ** 2 // 0 to 1, biased toward 0 (aka ease-in)
let impetuousV = v ** 0.5 // 0 to 1, biased toward 1 (aka ease-out)

// A weird thing about exponents is they're often undefined for negative numbers.
// You can "fix" that by taking the absolute value.
let mirroredV = abs(v) ** 0.5 // 1 to 0 to 1, biased toward 1

// The above has the often-unfortunate consequence of making all the values positive.
// To curve negative numbers while keeping them negative, you can use sign()
let perfectlyCurvedV = sign(v) * abs(v) ** .5 // -1 to 1, biased toward -1 and 1`}</pre>

      <p>To see graphs of the above examples:</p>
      <ul>
        <li>
          Basic value <a href="https://www.wolframalpha.com/input?i=y+%3D+x+in+%5B0%2C+1%5D">v</a>
        </li>
        <li>
          Indolence <a href="https://www.wolframalpha.com/input?i=y+%3D+x+**+2+plot+in+%5B0%2C+1%5D">v ** 2</a>
        </li>
        <li>
          Impetuousness <a href="https://www.wolframalpha.com/input?i=y+%3D+x+**+.5+plot+real+in+%5B-1%2C+1%5D">v ** .5</a>
        </li>
        <li>
          Mirroring <a href="https://www.wolframalpha.com/input?i=y+%3D+abs%28x%29+**+.5+plot+in+%5B-1%2C+1%5D">abs(v) ** .5</a>
        </li>
        <li>
          That's proper <a href="https://www.wolframalpha.com/input?i=y+%3D+sign%28x%29++abs%28x%29+**+.5+plot+in+%5B-1%2C+1%5D">sign(v) * abs(v) ** .5</a>
        </li>
      </ul>

      <p>
        <em>(If the the above aren't very helpful, congratulations, you've discovered an authentic use case for PlayBook)</em>
      </p>

      <h2>CONSTERNATO INTERMEZZO (a secret brainrot)</h2>

      <blockquote>
        Wait wait wait - why is <code>line()</code> stateful? Why not the usual <code>moveTo()</code> and <code>lineTo()</code>? This seems bad, I don't understand it and I
        automatically distrust it.
      </blockquote>

      <p>
        Cool your jets, space cadet. If you want to forget that <code>line()</code> is stateful, just use <code>move()</code> like you'd use <code>moveTo()</code> and{" "}
        <code>line()</code> like you'd use <code>lineTo()</code>. Easy peasy lemon leaven. Familiarity restored.
      </p>

      <p>Cool? Okay.</p>

      <p>
        Now, let's talk about why the Tenfold line-drawing function is different - why it has some internal state, such that the first time you call it it just moves "the pen" and
        then all subsequent times it draws a line.
      </p>

      <p>
        It is likely that you'll call the line drawing function inside a loop. "It's likely" - scratch that, if you're not calling the line function inside a loop <em>at all</em>,
        you should let me know because I want to see what you're doing, because it's perhaps misguided or at least fascinatingly atypical. So, ahem: it is <em>overwhelmingly</em>{" "}
        likely you're calling the line function inside a loop.
      </p>

      <p>
        Traditionally, you need to do a <code>moveTo</code> with the first position and then <code>lineTo</code> with all following positions. Here are three common patterns for
        this:
      </p>

      <pre>{`// … do a bunch of stuff to calculate x and y, then…
moveTo(x, y)

for (let i = low; i < high; i++) {
\t// … duplicate some or all of that logic to calculate x and y, then…
\tlineTo(x, y)
}

// OR

let first = true
for (let i = low; i < high; i++) {
\t// … do a bunch of stuff to calculate x and y, then…
\tif (first) {
\t\tmoveTo(x, y)
\t\tfirst = false
\t} else lineTo(x, y)
}

// OR

for (let i = low; i < high; i++) {
\t// … do a bunch of stuff to calculate x and y, then…
\tif (i == low) moveTo(x, y)
\telse lineTo(x, y)
}`}</pre>

      <p>
        All of these are bad in different ways. The first two are pretty obvious - duplication and busywork. The last example is (very) subtly pernicious - it only works for
        certain kinds of loops where the value of <code>low</code> is known and can be reliably compared, and it hides the real meaning of the check (that you need to 'move' before
        you 'draw') behind some math that's not causally related. What I've found is that the sorts of changes I'm likely to make as I iterate on an algorithm necessitate switching
        between these different approaches, and their differences chafe, and gun at my feet.
      </p>

      <p>
        Upon reflection, <code>moveTo</code> seems to combine two unrelated meanings: indicating that a new line is about to begin, and indicating where to begin it. One is about
        space, the other is about pen state (or perhaps about "connectedness" if you be all weird 'bout it).
      </p>

      <p>
        Also, note that <code>moveTo</code> and <code>lineTo</code> are <em>also</em> stateful, in that <code>lineTo</code> draws a line{" "}
        <em>
          from the point given by the most recent <code>moveTo</code> or <code>lineTo</code> call
        </em>
        .
      </p>

      <p>
        So, all that being said, with the Tenfold drawing API, which makes <code>line()</code> <em>differently</em> stateful, we can do:
      </p>

      <pre>{`begin()
for (let i = low; i < high; i++) {
\t// … do a bunch of stuff to calculate x and y, then…
\tline(x, y)
}`}</pre>

      <p>I'd argue that this is a much nicer API.</p>

      <h2>Conclusion</h2>

      <p>Thank you for joining our collaborative art project. Can't wait to see what you create.</p>

      <p>
        Huge thanks to Todd for incepting, leading, and designing this project, chee for implementing the Patchwork tool, Peter for a handful of formative rounds of feedback, Alex
        Warth for upcoming audio chaos, and anyone else I'm forgetting who helped get this ball rolling.
      </p>

      <p>This is the beginning! All forms of feedback are welcome and will be heard as we prepare for friends of the lab to have their turn.</p>
    </div>
  )
}
