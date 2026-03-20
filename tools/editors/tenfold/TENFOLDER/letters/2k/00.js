// Potassium by Mimi
// Click to add water

// 1. DRAW THE PERIODIC TABLE FRAME
// ------------------------------
// Draw the outer border slightly inside the clip edge
begin()
rect()

// Draw the text labels
// Atomic Number (Top Left)
text("19", -0.8, -0.75, 0.15)

// Element Name (Bottom Center-ish)
// We adjust X to center the word "Potassium"
text("Potassium", -0.45, 0.65, 0.145)

// Atomic Weight (Bottom Center-ish)
text("39.098", -0.22, 0.81, 0.1)

// 2. THE SAND PHYSICS SYSTEM
// --------------------------
// We will construct the big "K" manually out of thousands of dots.
// This allows us to manipulate every "grain" of the letter.

// Configuration for the K shape
const density = 450 // How many grains of sand per limb
const thick = 0.15 // Thickness of the K strokes

// Helper function to draw a single grain of sand
function grain(ox, oy) {
  // A. Calculate Physics
  // --------------------

  // 1. Natural Shimmer (Brownian motion)
  // Use time (params.t) and random noise to make it vibrate
  let noiseX = rand(-0.01, 0.01) * sin(params.t * 10)
  let noiseY = rand(-0.01, 0.01) * cos(params.t * 10)

  // 2. Interaction (The Explosion)
  // Check distance between this grain and the mouse (params.x, params.y)
  let dx = ox - params.x
  let dy = oy - params.y
  let dist = (dx ** 2 + dy ** 2) ** 0.2

  // Explode if mouse is close (within 0.5 units)
  let pushX = 0
  let pushY = 0

  // If the mouse is active (params.x is rarely exactly 0 if active)
  // and close to the grain:
  if (dist < 0.6) {
    // Calculate repulsion force (inverse square law-ish)
    let force = (0.6 - dist) * 15 // Strength multiplier

    // Add chaos/scatter based on random noise
    pushX = (dx / dist) * force + rand(-0.1, 0.1)
    pushY = (dy / dist) * force + rand(-0.1, 0.1)
  }

  // B. Draw the Grain
  // -----------------
  let finalX = ox + noiseX + pushX
  let finalY = oy + noiseY + pushY

  // Draw a tiny dot (move to pos, draw line to pos + epsilon)
  move(finalX, finalY)
  line(finalX + 0.01, finalY)
}

// 3. GENERATE THE "K"
// -------------------
// We generate the K using three rectangular volumes of sand.

// LIMB 1: The Vertical Spine
// x: -0.4 to -0.2, y: -0.5 to 0.5
for (let i = 0; i < density; i++) {
  let gx = rand(-0.45, -0.25)
  let gy = rand(-0.5, 0.5)
  grain(gx, gy)
}

// LIMB 2: The Top Arm
// Starts near center, goes up-right
for (let i = 0; i < density; i++) {
  // Interpolate along the arm
  let t = rand(0, 0.9)
  // Start point (-0.25, 0) -> End point (0.35, -0.5)
  let lx = -0.25 + 0.55 * t
  let ly = 0 + -0.5 * t

  // Add thickness scatter
  lx += rand(-thick / 2, thick / 2)
  ly += rand(-thick / 2, thick / 2)

  grain(lx, ly)
}

// LIMB 3: The Bottom Arm
// Starts near center, goes down-right
for (let i = 0; i < density; i++) {
  // Interpolate along the arm
  let t = rand(0, 0.9)
  // Start point (-0.2, 0) -> End point (0.35, 0.5)
  let lx = -0.2 + 0.55 * t
  let ly = 0 + 0.5 * t

  // Add thickness scatter
  lx += rand(-thick / 2, thick / 2)
  ly += rand(-thick / 2, thick / 2)

  grain(lx, ly)
}
