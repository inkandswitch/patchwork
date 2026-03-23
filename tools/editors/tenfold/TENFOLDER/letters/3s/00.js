// This Cool S is by Mimi and every high school student since 1980

// I'll come back and make it good math but rn it's trail and error

// vars
let c = 0 // centre
let th = -0.5 // top of top vertical line
let tb = -0.2 // bottom of top vertical line
let spacing = 0.4 //width from middle to side

scalen(1.2) // big plz

// top 3 lines
line(c,th)
line(c,tb)

move(spacing, th)
line(spacing,tb)

move(-spacing, th)
line(-spacing, tb)

// bottom 3 lines

move(c,-th)
line(c,-tb)

move(spacing, -th)
line(spacing,-tb)

move(-spacing, -th)
line(-spacing, -tb)

//middle diagonals

move(-spacing, (th-tb)/1.5)
line(c, (tb-th)/1.5)

move(0, (th-tb)/1.5)
line(spacing, (tb-th)/1.5)

// top diagonals

move(0, th+((th+tb)/2))
line(spacing, th)

move(0, th+((th+tb)/2))
line(-spacing, th)

// bottom diagonals
move(0, -th-((th+tb)/2))
line(spacing, -th)

move(0, -th-((th+tb)/2))
line(-spacing, -th)

// final half middle diagonals

move(spacing, (th-tb)/1.5)
line((c+spacing/2), (tb-th)/64)

move(-spacing, -(th-tb)/1.5)
line(-(c+spacing/2), (tb-th)/64)
