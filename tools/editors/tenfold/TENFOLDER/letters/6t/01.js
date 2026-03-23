// Palm Tree
// By Todd

// A palm tree for the letter T.
// Uses a reusable SVG renderer — just paste in your SVG!

// ============================================================
// REUSABLE SVG RENDERER
// Copy this section to use in other characters
// ============================================================

// Parse an SVG string and extract viewBox + all paths with class/id
let parseSVG = (svg) => {
  let vbMatch = svg.match(/viewBox=["']([^"']+)["']/)
  let viewBox = vbMatch ? vbMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 100, 100]
  
  let paths = []
  let pathRegex = /<path([^>]*)>/g
  let match
  while ((match = pathRegex.exec(svg)) !== null) {
    let attrs = match[1]
    let dMatch = attrs.match(/\bd=["']([^"']+)["']/)
    if (!dMatch) continue
    let classMatch = attrs.match(/\bclass=["']([^"']+)["']/)
    let idMatch = attrs.match(/\bid=["']([^"']+)["']/)
    paths.push({ 
      d: dMatch[1], 
      class: classMatch ? classMatch[1] : null, 
      id: idMatch ? idMatch[1] : null, 
      index: paths.length 
    })
  }
  return { viewBox, paths }
}

let parseNums = (d) => {
  let nums = []
  let regex = /-?(?:\d+\.?\d*|\.\d+)/g
  let match
  while ((match = regex.exec(d)) !== null) {
    nums.push(Number(match[0]))
  }
  return nums
}

let drawSVGPath = (d, viewBox, transform) => {
  let [vx, vy, vw, vh] = viewBox
  let cx = vx + vw / 2
  let cy = vy + vh / 2
  let scale = max(vw, vh) / 2
  
  let toClip = (x, y) => {
    let px = (x - cx) / scale
    let py = (y - cy) / scale
    return transform ? transform(px, py) : [px, py]
  }
  
  let nums = parseNums(d)
  let i = 0
  let x = 0, y = 0
  let startX = 0, startY = 0
  let lastCx = 0, lastCy = 0
  
  let cmdRegex = /([MCLQSAHVZmclqsahvz])/g
  let tokens = d.split(cmdRegex).filter(s => s.length > 0)
  
  for (let t = 0; t < tokens.length; t++) {
    
    let token = tokens[t]
    if (!/^[MCLQSAHVZmclqsahvz]$/.test(token)) continue
    
    let cmd = token
    let numCount = 0
    if (t + 1 < tokens.length && !/^[MCLQSAHVZmclqsahvz]$/.test(tokens[t + 1])) {
      numCount = parseNums(tokens[t + 1]).length
    }
    
    let argsPerCmd = { M: 2, m: 2, L: 2, l: 2, H: 1, h: 1, V: 1, v: 1, 
                       C: 6, c: 6, S: 4, s: 4, Q: 4, q: 4, Z: 0, z: 0 }
    let argCount = argsPerCmd[cmd] || 0
    let iterations = argCount > 0 ? floor(numCount / argCount) : 1
    if (iterations < 1) iterations = 1
    
    for (let iter = 0; iter < iterations; iter++) {
      switch (cmd) {
        case 'M':
          x = nums[i++]; y = nums[i++]
          startX = x; startY = y
          move(...toClip(x, y))
          cmd = 'L'
          break
        case 'm':
          x += nums[i++]; y += nums[i++]
          startX = x; startY = y
          move(...toClip(x, y))
          cmd = 'l'
          break
        case 'L':
          x = nums[i++]; y = nums[i++]
          line(...toClip(x, y))
          break
        case 'l':
          x += nums[i++]; y += nums[i++]
          line(...toClip(x, y))
          break
        case 'H':
          x = nums[i++]
          line(...toClip(x, y))
          break
        case 'h':
          x += nums[i++]
          line(...toClip(x, y))
          break
        case 'V':
          y = nums[i++]
          line(...toClip(x, y))
          break
        case 'v':
          y += nums[i++]
          line(...toClip(x, y))
          break
        case 'C': {
          let x1 = nums[i++], y1 = nums[i++]
          let x2 = nums[i++], y2 = nums[i++]
          x = nums[i++]; y = nums[i++]
          lastCx = x2; lastCy = y2
          cubic(...toClip(x1, y1), ...toClip(x2, y2), ...toClip(x, y))
          break
        }
        case 'c': {
          let x1 = x + nums[i++], y1 = y + nums[i++]
          let x2 = x + nums[i++], y2 = y + nums[i++]
          let dx = nums[i++], dy = nums[i++]
          lastCx = x2; lastCy = y2
          x += dx; y += dy
          cubic(...toClip(x1, y1), ...toClip(x2, y2), ...toClip(x, y))
          break
        }
        case 'S': {
          let x1 = 2 * x - lastCx, y1 = 2 * y - lastCy
          let x2 = nums[i++], y2 = nums[i++]
          x = nums[i++]; y = nums[i++]
          lastCx = x2; lastCy = y2
          cubic(...toClip(x1, y1), ...toClip(x2, y2), ...toClip(x, y))
          break
        }
        case 's': {
          let x1 = 2 * x - lastCx, y1 = 2 * y - lastCy
          let x2 = x + nums[i++], y2 = y + nums[i++]
          let dx = nums[i++], dy = nums[i++]
          lastCx = x2; lastCy = y2
          x += dx; y += dy
          cubic(...toClip(x1, y1), ...toClip(x2, y2), ...toClip(x, y))
          break
        }
        case 'Q': {
          let x1 = nums[i++], y1 = nums[i++]
          x = nums[i++]; y = nums[i++]
          quadratic(...toClip(x1, y1), ...toClip(x, y))
          break
        }
        case 'q': {
          let x1 = x + nums[i++], y1 = y + nums[i++]
          let dx = nums[i++], dy = nums[i++]
          x += dx; y += dy
          quadratic(...toClip(x1, y1), ...toClip(x, y))
          break
        }
        case 'Z':
        case 'z':
          x = startX; y = startY
          line(...toClip(x, y))
          break
      }
    }
  }
}

let drawSVG = (svg, filter, getTransform) => {
  let { viewBox, paths } = parseSVG(svg)
  for (let path of paths) {
    if (filter && !filter(path)) continue
    let transform = getTransform ? getTransform(path) : null
    begin()
    drawSVGPath(path.d, viewBox, transform)
  }
}

// ============================================================
// PALM TREE
// ============================================================

// Interaction
let windStrength = declip(params.q, 0.02, 0.12)  // waffle x = wind strength

// Time - t goes 0 to 1 over 8 seconds
let t = params.t

// Pivot point for frond rotation (where fronds attach to trunk, in clip space)
let pivotX = 0
let pivotY = -0.35

// The complete SVG
let svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 275.9222 275.9222">
  <path class="frond" d="M144.1891,77.1086c-15.9084-12.6317-38.6403,16.5743-40.8706,24.8737-2.7173,10.1125-.9739,20.5529,2.4149,30.5739,6.1613-9.347,15.604-17.4257,25.0317-25.5143"/>
  <path class="frond" d="M143.5491,102.6824c11.5798,11.734,18.3706,25.5691,19.4467,39.6196,15.166-10.0229,21.091-25.8704,14.7692-39.503-3.0272-6.5281-10.3383-13.1911-20.5336-13.3649"/>
  <path class="frond" d="M92.7213,94.6183c-22.661,11.6497-36.3633,30.743-35.7977,49.8821,8.76-10.2208,20.7127-19.2055,34.8616-26.2051"/>
  <path class="frond" d="M105.4924,84.9159c-20.8709.0957-41.7081,2.8317-61.0904,8.0213-18.269,4.8915-36.6731,13.2031-41.5343,25.9809,22.8215-5.8139,45.1415-14.5143,69.5491-14.1363"/>
  <path class="frond" d="M182.1874,96.8528c8.9736,2.2464,17.0326,5.8642,24.7043,9.7091,15.1247,7.5801,29.8955,17.0523,33.7145,29.4495,2.6689-17.3216-8.3882-35.3294-28.4739-46.3732,15.9041,3.466,31.006,8.5805,44.604,15.1059-5.3075-15.9134-26.7381-27.6499-49.9068-32.6205"/>
  <path class="frond" d="M149.8217,67.0566c25.2371-20.6072,65.4225-32.575,105.1528-31.3159-17.2324,6.0318-35.0407,12.3824-46.8081,22.7551,22.0386-2.577,45.3924.245,64.7013,7.8182-8.8527.4783-17.4682,2.7755-24.3922,6.5038"/>
  <path class="frond" d="M123.8229,67.2891c-18.2342-20.9727-50.0362-36.4285-85.4426-41.5252,14.2125,7.6369,26.2894,17.0536,35.4208,27.6185-21.2421-1.3863-44.4329-2.4655-62.1445,5.5168,20.2318-.1843,40.5048,3.8586,57.296,11.4262-18.506,2.3098-35.6091,9.3471-47.0584,19.3628"/>
  <path class="frond" d="M137.617,51.9278c2.1294-10.8284,10.7866-20.7034,21.7815-28.7641,10.9949-8.0606,24.2993-14.522,37.5223-20.9039-11.8365,12.5064-19.7336,26.6793-23.026,41.3247"/>
  <path class="frond" d="M136.4609,32.4488c.0302-2.7414-2.7424-5.1061-5.5319-7.111-13.2234-9.5038-29.8543-16.5167-46.2818-23.4185,11.3784,12.2581,19.0724,26.0459,22.4889,40.3004"/>
  <path class="trunk" id="trunk-left" d="M132.5253,124.7752c2.4647,47.7597-1.4124,95.6657-11.5704,142.9664"/>
  <path class="trunk" id="trunk-right" d="M152.3227,133.0568c-3.0535,46.591-5.9198,94.244,14.3221,138.8625"/>
</svg>
`

// Create wind transform for each path
let getWindTransform = (path) => {
  let idx = path.index
  let numFronds = 9
  
  if (path.class === 'frond') {
    // Phase offset: spread fronds evenly through the cycle
    // Using idx/numFronds means they're staggered but all loop cleanly
    let phase = idx / numFronds
    
    // INTEGER frequencies for clean looping:
    // freq=1: one full cycle (center → left → center → right → center)
    // freq=2: two cycles for subtle rustle overlay
    let swayFreq = 1
    let rustleFreq = 2
    
    // Amplitude varies slightly per frond
    let swayAmp = windStrength * (1 + (idx % 3) / 10)
    let rustleAmp = windStrength / 4
    
    // Rotation amplitude (in turns, so 0.02 = about 7 degrees)
    let rotAmp = windStrength / 3
    
    return (x, y) => {
      // Distance from pivot affects how much this point moves
      let dx = x - pivotX
      let dy = y - pivotY
      let dist = sqrt(dx * dx + dy * dy)
      
      // Main sway: -sinn for "center → left → right → center"
      let sway = -sinn(t * swayFreq + phase) * swayAmp
      
      // Faster rustle layered on top
      let rustle = sinn(t * rustleFreq + phase * 2) * rustleAmp
      
      // Combined horizontal movement, scaled by distance from pivot
      let moveX = (sway + rustle) * dist
      
      // Rotation around pivot
      let rotAngle = -sinn(t * swayFreq + phase) * rotAmp * dist
      let cosR = cosn(rotAngle)
      let sinR = sinn(rotAngle)
      let rx = pivotX + dx * cosR - dy * sinR
      let ry = pivotY + dx * sinR + dy * cosR
      
      // Subtle stretch: fronds extend slightly at sway extremes
      let stretch = 1 + abs(sinn(t * swayFreq + phase)) * windStrength / 8
      let sx = pivotX + (rx - pivotX) * stretch
      let sy = pivotY + (ry - pivotY) * stretch
      
      return [sx + moveX, sy]
    }
  } 
  else if (path.class === 'trunk') {
    // Trunk: slow, subtle sway - freq=1 for one cycle
    return (x, y) => {
      // More movement at top, anchored at bottom
      let heightFactor = (1 - y) / 2
      heightFactor = heightFactor * heightFactor  // quadratic falloff
      
      let sway = -sinn(t) * windStrength / 3 * heightFactor
      
      return [x + sway, y]
    }
  }
  
  return null
}

// Draw the SVG with wind effects
drawSVG(svg, null, getWindTransform)