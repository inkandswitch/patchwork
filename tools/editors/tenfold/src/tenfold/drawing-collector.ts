const TAU = Math.PI * 2;

// Collects geometric data from drawing operations for analysis.
// Designed to be reset and reused each frame to minimize GC pressure.
export class DrawingCollector {
  // Raw position data - preallocated arrays
  positions: { x: number; y: number }[] = [];
  positionCount = 0;

  // Path tracking
  lastX = 0;
  lastY = 0;
  hasLastPosition = false;

  // Aggregate metrics (updated incrementally)
  pathLength = 0;
  moveCount = 0;
  lineCount = 0;
  rectCount = 0;
  circleCount = 0;
  arcCount = 0;

  // Bounding box
  minX = Infinity;
  maxX = -Infinity;
  minY = Infinity;
  maxY = -Infinity;

  // Arc/curvature tracking
  totalArcAngle = 0; // in radians
  totalArcRadius = 0;

  // Rectangle area
  totalRectArea = 0;

  // Circle area
  totalCircleArea = 0;

  // Direction histogram (8 buckets, 45° each)
  directionBins = new Float32Array(8);

  reset() {
    this.positionCount = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.hasLastPosition = false;
    this.pathLength = 0;
    this.moveCount = 0;
    this.lineCount = 0;
    this.rectCount = 0;
    this.circleCount = 0;
    this.arcCount = 0;
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;
    this.totalArcAngle = 0;
    this.totalArcRadius = 0;
    this.totalRectArea = 0;
    this.totalCircleArea = 0;
    this.directionBins.fill(0);
  }

  private recordPosition(x: number, y: number) {
    // Reuse or grow positions array
    if (this.positionCount >= this.positions.length) {
      this.positions.push({ x: 0, y: 0 });
    }
    this.positions[this.positionCount].x = x;
    this.positions[this.positionCount].y = y;
    this.positionCount++;

    // Update bounding box
    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  private recordDirection(dx: number, dy: number) {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.0001) return;
    // Angle in [0, 2π), then map to 8 buckets
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += TAU;
    const bucket = Math.floor((angle / TAU) * 8) % 8;
    this.directionBins[bucket] += len; // weight by segment length
  }

  recordMove(x: number, y: number) {
    this.moveCount++;
    this.recordPosition(x, y);
    this.lastX = x;
    this.lastY = y;
    this.hasLastPosition = true;
  }

  recordLine(x: number, y: number) {
    this.lineCount++;
    this.recordPosition(x, y);

    if (this.hasLastPosition) {
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.pathLength += dist;
      this.recordDirection(dx, dy);
    }

    this.lastX = x;
    this.lastY = y;
    this.hasLastPosition = true;
  }

  recordRect(x: number, y: number, w: number, h: number) {
    this.rectCount++;
    this.totalRectArea += Math.abs(w * h);
    // Record corners for bounding box
    this.recordPosition(x, y);
    this.recordPosition(x + w, y + h);
    // Add perimeter to path length
    this.pathLength += 2 * (Math.abs(w) + Math.abs(h));
    // Reset last position (rect is self-contained)
    this.hasLastPosition = false;
  }

  recordCircle(x: number, y: number, r: number) {
    this.circleCount++;
    this.totalCircleArea += Math.PI * r * r;
    this.totalArcAngle += TAU;
    this.totalArcRadius += r;
    // Record bounding box of circle
    this.recordPosition(x - r, y - r);
    this.recordPosition(x + r, y + r);
    // Add circumference to path length
    this.pathLength += TAU * r;
    // Reset last position
    this.hasLastPosition = false;
  }

  recordArc(
    x: number,
    y: number,
    r: number,
    start: number,
    end: number,
    ccw: boolean
  ) {
    this.arcCount++;
    // Calculate arc angle (in radians)
    let angle = (end - start) * TAU;
    if (ccw) angle = -angle;
    // Normalize to positive
    angle = Math.abs(angle);
    this.totalArcAngle += angle;
    this.totalArcRadius += r;

    // Record center for bounding box (approximation)
    this.recordPosition(x, y);

    // Add arc length to path length
    this.pathLength += angle * r;

    // Update last position to arc end
    const endAngle = end * TAU;
    this.lastX = x + r * Math.cos(endAngle);
    this.lastY = y + r * Math.sin(endAngle);
    this.hasLastPosition = true;
  }

  // Analysis methods - computed on demand after frame collection

  get opCount() {
    return (
      this.moveCount +
      this.lineCount +
      this.rectCount +
      this.circleCount +
      this.arcCount
    );
  }

  get boundingWidth() {
    return this.maxX === -Infinity ? 0 : this.maxX - this.minX;
  }

  get boundingHeight() {
    return this.maxY === -Infinity ? 0 : this.maxY - this.minY;
  }

  get boundingArea() {
    return this.boundingWidth * this.boundingHeight;
  }

  get centerX() {
    if (this.positionCount === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.positionCount; i++) sum += this.positions[i].x;
    return sum / this.positionCount;
  }

  get centerY() {
    if (this.positionCount === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.positionCount; i++) sum += this.positions[i].y;
    return sum / this.positionCount;
  }

  get spreadX() {
    if (this.positionCount < 2) return 0;
    const mean = this.centerX;
    let sumSq = 0;
    for (let i = 0; i < this.positionCount; i++) {
      const d = this.positions[i].x - mean;
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / this.positionCount);
  }

  get spreadY() {
    if (this.positionCount < 2) return 0;
    const mean = this.centerY;
    let sumSq = 0;
    for (let i = 0; i < this.positionCount; i++) {
      const d = this.positions[i].y - mean;
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / this.positionCount);
  }

  // Curvature: ratio of arc angle to path length (higher = more curved)
  get curvature() {
    if (this.pathLength < 0.0001) return 0;
    return this.totalArcAngle / this.pathLength;
  }

  // Density: path length relative to bounding area
  get density() {
    const area = this.boundingArea;
    if (area < 0.0001) return 0;
    return this.pathLength / area;
  }

  // Discontinuity: ratio of moves to total line operations
  get discontinuity() {
    const lineOps = this.moveCount + this.lineCount;
    if (lineOps === 0) return 0;
    return this.moveCount / lineOps;
  }

  // Dominant direction (0-7, representing 8 compass directions)
  get dominantDirection() {
    let maxIdx = 0;
    let maxVal = this.directionBins[0];
    for (let i = 1; i < 8; i++) {
      if (this.directionBins[i] > maxVal) {
        maxVal = this.directionBins[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  // Direction entropy (0 = all one direction, higher = more varied)
  get directionEntropy() {
    let total = 0;
    for (let i = 0; i < 8; i++) total += this.directionBins[i];
    if (total < 0.0001) return 0;

    let entropy = 0;
    for (let i = 0; i < 8; i++) {
      const p = this.directionBins[i] / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy / 3; // Normalize to ~[0,1] (max entropy is log2(8)=3)
  }
}

// Persistent collectors for each letter slot (reused each frame)
export const collectors: DrawingCollector[] = [];
for (let i = 0; i < 9; i++) {
  collectors.push(new DrawingCollector());
}

// Current collector being used during drawing
export let activeCollector: DrawingCollector | null = null;

export function setActiveCollector(collector: DrawingCollector | null) {
  activeCollector = collector;
}
