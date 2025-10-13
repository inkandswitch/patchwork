export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;

  const ta = typeof a;
  const tb = typeof b;
  if (ta !== tb) return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Objects
  if (ta === "object" && tb === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    const bk = Object.keys(bo);
    if (ak.length !== bk.length) return false;
    // Sort keys for stable compare without allocating extra structures repeatedly
    ak.sort();
    bk.sort();
    for (let i = 0; i < ak.length; i++) {
      if (ak[i] !== bk[i]) return false;
      const key = ak[i];
      if (!deepEqual(ao[key], bo[key])) return false;
    }
    return true;
  }

  // Fallback (numbers, strings, booleans, symbols, bigints, functions)
  return false;
}








