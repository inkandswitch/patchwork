export default function TenfoldDocs() {
  return (
    <div class="tenfold-docs">
      <h1>Welcome to Tenfold</h1>

      <p>
        Read this guide to learn the ropes,
        <br />
        or just start clicking around and hope
        <br />
        for the best :D
      </p>

      <h2>{"<1 • The Human Element>"}</h2>

      <p>
        If you're unsure what to do,
        <br />
        please let us help you!
      </p>

      <p>
        Post questions in the <code>#tenfold</code> channel.
        <br />
        Hang out in the <code>#FOLDNET</code> channel.
      </p>

      <p>
        To make letters, you need to use JavaScript.
        <br />
        If you've never written JavaScript before,
        <br />
        Tenfold would be a lovely way to try it.
      </p>

      <h2>{"<2 • The Graphical User Interface>"}</h2>

      <p>
        To the left are nine letters
        <br />
        with a central control area.
      </p>

      <p>
        Here on the right is this readme
        <br />
        and, soon, computer code to edit.
      </p>

      <p>A low-res screenshot of Tenfold:</p>

      <pre>{`I N K ………………
& === ……………
S W I [#=]
T C H [I]`}</pre>

      <p>Zoom in on the letter "I":</p>

      <pre>{`IIIIIIII
   II
   II
   II
IIIIIIII
<I00>  ⦿`}</pre>

      <p>
        <code>{"<I00>"}</code> flips through variations of the letter.
        <br />
        <code>⦿</code> flips between the code and these docs.
      </p>

      <p>
        Click and drag on the letter and,
        <br />
        if the code was written just so,
        <br />
        it might do something.
        <br />
        (Might not though.)
      </p>

      <p>Zoom in on the second row:</p>

      <pre>{`   _
 /   \\    #     #           #
 \\_          #    #      #    #
 /                  #   #
|    __-
 \\____/  ||||||||||||||||||||||`}</pre>

      <p>The ampersand is inert. It holds place.</p>

      <p>
        To the right, a space for waffles.
        <br />
        Each waffle belongs to one letter.
        <br />
        You can click and drag a waffle and,
        <br />
        if the code was written just so,
        <br />
        the letter might do something.
        <br />
        (Might not though.)
      </p>

      <p>
        Below the waffles is the <code>time wave</code>.
        <br />
        Click and drag to…ot gard dna kcilC
      </p>

      <h2>{"<3 • Drawing with Code>"}</h2>

      <p>
        Drawing is the art of mark-making,
        <br />
        and the following functions are how
        <br />
        you make your mark with computer code.
      </p>

      <p>
        These are the <em>creative constraints</em> of Tenfold.
      </p>

      <p>
        If there's something you want to do,
        <br />
        the challenge is to figure out how
        <br />
        to do it with just these tools.
      </p>

      <h3>Space</h3>

      <p>
        Each letter occupies space,
        <br />
        and we measure the space with coordinates.
      </p>

      <p>You'll find 0,0 - the origin - at the center.</p>

      <p>
        Negatives are up and left.
        <br />
        Positives are right and down.
      </p>

      <p>Some of my favourite positions:</p>

      <pre>{`-1,-1 ----- +1,-1
|       |       |
|       |       |
|      0,0      |
|       |       |
|       |       |
-1,+1 ----- +1,+1
<X00>             ⦿`}</pre>

      <h3>Lines</h3>

      <h4>
        <code>line(x, y)</code>
      </h4>

      <p>
        This code lets you draw a line.
        <br />
        Call it once to set the start point.
        <br />
        Call it again to draw a line from
        <br />
        the last point to the new one.
      </p>

      <h4>
        <code>begin()</code>
      </h4>

      <p>
        Call this function when you'd like
        <br />
        to begin drawing a new line.
      </p>

      <p>
        The next time you call <code>line(x, y)</code>,
        <br />
        it'll place the start point.
      </p>

      <h4>
        <code>move(x, y)</code>
      </h4>

      <p>
        This is the same as <code>begin()</code> then <code>line(x, y)</code>.
      </p>

      <h3>Shapes</h3>

      <h4>
        <code>rect(x, y, width, height)</code>
      </h4>

      <p>
        A rectangle drawn from its top left.
        <br />
        Width and height can be negative.
      </p>

      <h4>
        <code>circle(x, y, radius)</code>
      </h4>

      <p>
        A special ring within which you summon
        <br />
        your resolve and dispel dissonance.
      </p>

      <h4>
        <code>text(string, x, y, size)</code>
      </h4>

      <p>
        Draw the given string of letters.
        <br />
        Use "\n" for newlines.
      </p>

      <h3>There Are Many Functions</h3>

      <p>
        We won't list them all here.
        <br />
        You might discover them yourself
        <br />
        or learn about them from friends.
      </p>

      <p>The functions all have sensible default values.</p>

      <p>
        Try <code>rect()</code> or <code>circle()</code>,
        <br />
        or <code>text("up here")</code>.
      </p>

      <h2>{"<4 • Parameters>"}</h2>

      <p>
        There are three kinds of parameters you can use to make your letter animated and interactive. It's recommended that you find a way to use all three, since that'll make your
        letter maximally playful - even something trivial is fine.
      </p>

      <h3>Time</h3>
      <p>
        All the letters share a <code>params.t</code> value representing the current time. This value slowly rises from 0 to 1, looping back to 0 every few seconds. You can use
        this value to animate your letter by making some part of the drawing change as <code>params.t</code> changes. For instance, to make your letter appear to shuffle from side
        to side, you can multiply some <code>x</code> values by <code>sin(params.t * TAU)</code>.
      </p>

      <h3>Waffles</h3>
      <p>
        Each letter is controlled by a draggable handle that happens to look like a waffle. The variables <code>params.q</code> &amp; <code>params.r</code> represent the horizontal
        &amp; vertical position of the waffle, and both range from -1 to 1 (left/top to right/bottom).
      </p>

      <h3>Prodding</h3>
      <p>
        You can also poke directly at letters using your mouse. When a letter is poked (ie: dragged), the position of the mouse is available as variables <code>params.x</code>{" "}
        &amp; <code>params.y</code>, both ranging from -1 to 1.
      </p>

      <h2>{"<5 • Common Ranges>"}</h2>

      <p>
        When working with the drawing functions and parameters described above, and the helper functions described below, you'll notice that they're all designed to work with
        values from <code>-1 to 1</code> or <code>0 to 1</code>. These particular ranges are really, really useful, so we're going to give them names to make it easier to talk about them.
      </p>

      <h3>-1 to 1 - "Clip"</h3>
      <p>
        Each of the letters is drawn inside a little square. X/Y positions inside the square range from -1 at the left &amp; top edges, to +1 at the right &amp; bottom edges. We
        refer to positions between -1 and +1 as existing in "clip space" - if it helps, imagine that these letters are being "clipped" for a ransom note with scissors.
      </p>

      <p>
        One nice thing about "clip space" is you don't have to think about how big the letter is - there are no pixels here. Another benefit is that position 0,0 is at the center
        of the letter - nice for symmetry.
      </p>

      <h3>0 to 1 - "Norm"(alized)</h3>
      <p>
        Some values, like the <code>start</code> and <code>end</code> used for arcs and <code>params.t</code> for time, are "normalized", which means they range from 0 to 1. But
        "normalized" is exhausting, so we often abbreviate this as "norm". So if you ever see "norm", know that it just means "0 to 1".
      </p>

      <p>
        Here's a nice thing that combines both of the above: <code>circle(0, 0, 1)</code> gives you a circle at the center of the letter that extends exactly to the edge of its
        grid square.
      </p>

      <h2>{"<6 • Math(s)>"}</h2>

      <p>
        One slightly math-y thing about clip and norm: numbers between -1 and 1 behave in stable, predictable ways when multiplied. You can multiply a bunch of clip/norm values
        together and they'll remain clip/norm. That's nice.
      </p>

      <p>
        Calling all JavaScript lovers:
        <br />
        In Tenfold, we've done <code>with(Math)</code> so you can just say <code>max(a,b)</code> instead of <code>Math.max(a,b)</code>, or <code>PI</code> instead of{" "}
        <code>Math.PI</code>, etc.
      </p>

      <p>
        In addition to the standard Math functions and constants, here are a handful of extra math functions you can use. You'll notice that many of them are designed to work with
        clip or norm values by default.
      </p>

      <h3>Range Conversions</h3>

      <h4>
        <code>norm(v, lo = -1, hi = 1)</code>
      </h4>

      <p>Convert TO norm.</p>

      <p>Takes a value that ranges from <code>lo</code> to <code>hi</code>, and remaps it to the range 0 to 1.</p>

      <h4>
        <code>clip(v, lo = -1, hi = 1)</code>
      </h4>

      <p>Convert TO clip.</p>

      <p>Takes a value that ranges from <code>lo</code> to <code>hi</code>, and remaps it to the range -1 to 1.</p>

      <h4>
        <code>denorm(v, lo = -1, hi = 1)</code>
      </h4>

      <p>Convert FROM norm.</p>

      <p>
        Takes a value that ranges from 0 to 1, and remaps it to the range <code>lo</code> to <code>hi</code>.
        <br />
        This is also known as 'lerp' (though with a different argument order).
      </p>

      <h4>
        <code>declip(v, lo = 0, hi = 1)</code>
      </h4>

      <p>Convert FROM clip.</p>

      <p>Takes a value that ranges from -1 to 1, and remaps it to the range <code>lo</code> to <code>hi</code>.</p>

      <h3>Range Manipulation</h3>

      <p>For the above functions, if you pass values that extend beyond the input range they'll be remapped proportionally. If you don't want that, use the following:</p>

      <h4>
        <code>clamp(v, lo = -1, hi = 1)</code>
      </h4>

      <p>Limits a value to be between <code>lo</code> and <code>hi</code>.</p>

      <h4>
        <code>renorm(v, lo = -1, hi = 1, LO = -1, HI = 1, doClamp = false)</code>
      </h4>

      <p>
        This function combines all the above.
        <br />
        Takes a value that ranges from <code>lo</code> to <code>hi</code>, and remaps it to the range <code>LO</code> to <code>HI</code>.
        <br />
        If <code>doClamp</code> is true, the result will be clamped to the range <code>LO</code> to <code>HI</code>.
      </p>

      <h3>Misc</h3>

      <h4>
        <code>TAU</code>
      </h4>

      <p>Equivalent to 2 * PI</p>

      <h4>
        <code>sinn(turns)</code> / <code>cosn(turns)</code>
      </h4>

      <p>Sine and cosine that take a normalized angle, which you can think of as "full turns"</p>

      <h4>
        <code>rand(lo = -1, hi = 1)</code>
      </h4>

      <p>Returns a random number between <code>lo</code> and <code>hi</code></p>

      <h4>
        <code>mod(v, d = 1)</code>
      </h4>

      <p>
        Gives you the remainder when <code>v</code> is divided by <code>d</code>, with different handling of negatives than the common <code>%</code> operator. This difference makes <code>mod()</code>{" "}
        useful for creating cycling patterns because it doesn't 'mirror' the pattern across 0.
      </p>

      <h4>
        <code>rotate(x, y, turns, px = 0, py = 0) =&gt; {"{x,y}"}</code>
      </h4>

      <p>
        Rotate point x,y around pivot point px,py by a given number of turns.
        <br />
        1 turn is equivalent to 360° or 2π radians.
        <br />
        Returns an object with the x,y of the rotated point.
      </p>

      <h2>{"<7 • Conclusion>"}</h2>

      <p>
        Thanks for joining our communal art project,
        <br />
        and celebrating ten years of Ink &amp; Switch.
        <br />
        We can't wait to see what you dream up.
      </p>

      <p>Credits:</p>
      <ul>
        <li>Todd Matthews - conceptual and graphic design</li>
        <li>chee rabbits - patchwork tools, system design</li>
        <li>Ivan Reese - api design, implementation, docs</li>
        <li>Everyone - feedback, letters, patchwork, &lt;333</li>
      </ul>
    </div>
  )
}
