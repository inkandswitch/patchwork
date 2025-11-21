/* // EXAMPLE LETTER FUNCTIONS ///////////////////////////////////////////////////////////////////////

function bounds(ctx) {
  ctx.rect(-1, -1, 2, 2);
}

function placeholder(str) {
  return (ctx, q, r, t, X, Y) => {
    ctx.text(str, -0.725, -0.8, 2);
  };
}

function catenoid(ctx, q, r, t, X, Y) {
  let U = Math.round(24 + Math.round(X * 10) * 2); // segments around the circle
  let V = Math.round(10 + Y * 8); // segments along the curve
  let rad = 0.1; // shift the curve away from the y axis
  let a = r + 1.4; // factor for the catenary curve
  let tilt = q * 0.2 + 0.2; // rotation around the x axis
  let roll = Math.sin(t * TAU) ** 7 * 0.03; // animated roll around the z axis
  let points = [];
  let xmin = 0;
  let xmax = 0;
  let ymin = 0;
  let ymax = 0;

  let point = (u, v) => {
    // Draw the catenary curve in the xy plane
    let y = denorm(v / V);
    let x = rad + a * Math.cosh(y / a) - a;
    let z = 0;

    // Lathe around the Y axis
    let uf = TAU * (u / U - 0.25);
    let x1 = x * Math.cos(uf) - z * Math.sin(uf);
    let z1 = x * Math.sin(uf) + z * Math.cos(uf);

    // Tilt around the X axis (for visual interest)
    let y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
    let z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);

    // Roll around the Z axis (animation)
    let x2 = x1 * Math.cos(roll) - y1 * Math.sin(roll);
    let y2 = x1 * Math.sin(roll) + y1 * Math.cos(roll);

    return { x: x2, y: y2 };
  };

  // build all points, and track the bounds
  for (let u = 0; u < U; u++) {
    for (let v = 0; v <= V; v++) {
      let p = point(u, v);
      points.push(p);
      xmin = Math.min(p.x, xmin);
      xmax = Math.max(p.x, xmax);
      ymin = Math.min(p.y, ymin);
      ymax = Math.max(p.y, ymax);
    }
  }

  // Normalize points to clip space
  for (let p of points) {
    p.x = renorm(p.x, xmin, xmax);
    p.y = renorm(p.y, ymin, ymax);
  }

  // render the wireframe
  for (let i = 0; i < points.length; i++) {
    // current point
    let a = points[i];

    // next point around the circle (wrapping)
    let b = points[(i + (V + 1)) % points.length];
    ctx.move(a.x, a.y);
    ctx.line(b.x, b.y);

    // next point along the curve (not wrapping)
    if ((i + 1) % (V + 1) != 0) {
      let b = points[i + 1];
      ctx.move(a.x, a.y);
      ctx.line(b.x, b.y);
    }
  }
}

function doubleyou(ctx, q, r, t, X, Y) {
  t = denorm((t + 1.5) % 1); // -1 to 1, phase shifted
  t = Math.sign(t) * Math.abs(t) ** 4; // -1 to 1, squished
  let J = declip(q, 0.05, 1); // how many wiggles
  let R = declip(r, 0.2, 2); // how tight are the wiggles
  let m = declip(t, 1, -2) * R; // wiggle start
  let M = declip(t, 2, -1) * R; // wiggle end
  for (let j = 0; j < 1; j += J) {
    ctx.begin();
    for (let x = m; x <= M; x += 0.01) {
      let frac = renorm(x, m, M, 0, 1);
      let y =
        -Math.cos((x * TAU * 2) / R) * 0.8 -
        declip(Math.cos(TAU * frac + PI)) * 0.4 * j +
        0.2;
      if (x < -1 || x > 1) continue;
      ctx.line(x, y);
    }
  }
}
 */
