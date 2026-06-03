/**
 * Color conversions sRGB ↔ OKLch.
 *
 * Two patterns sharing one math kernel. Inputs and outputs are CSS strings.
 * Math is the standard sRGB → linear sRGB → OKLab → OKLch pipeline
 * (Björn Ottosson). Use a real CSS Color Module 4 library in production;
 * this exists for live-demo legibility.
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

interface Rgb {
  r: number;
  g: number;
  b: number;
}
interface Oklch {
  l: number;
  c: number;
  h: number;
}

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i;
const OKLCH_FN = /^oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)/i;

function parseRgb(s: string): Rgb | undefined {
  const t = s.trim();
  const m6 = HEX6.exec(t);
  if (m6) {
    return {
      r: parseInt(m6[1], 16) / 255,
      g: parseInt(m6[2], 16) / 255,
      b: parseInt(m6[3], 16) / 255,
    };
  }
  const m3 = HEX3.exec(t);
  if (m3) {
    return {
      r: parseInt(m3[1] + m3[1], 16) / 255,
      g: parseInt(m3[2] + m3[2], 16) / 255,
      b: parseInt(m3[3] + m3[3], 16) / 255,
    };
  }
  const mr = RGB_FN.exec(t);
  if (mr) {
    return {
      r: parseFloat(mr[1]) / 255,
      g: parseFloat(mr[2]) / 255,
      b: parseFloat(mr[3]) / 255,
    };
  }
  return undefined;
}

function parseOklch(s: string): Oklch | undefined {
  const m = OKLCH_FN.exec(s.trim());
  if (!m) return undefined;
  const lRaw = m[1];
  const l = lRaw.endsWith("%") ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
  return { l, c: parseFloat(m[2]), h: parseFloat(m[3]) };
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function gammaToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function linearRgbToOklab({ r, g, b }: Rgb): {
  L: number;
  a: number;
  b: number;
} {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}
function oklabToLinearRgb(lab: { L: number; a: number; b: number }): Rgb {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function srgbToOklchObj(rgb: Rgb): Oklch {
  const linear: Rgb = {
    r: gammaToLinear(clamp01(rgb.r)),
    g: gammaToLinear(clamp01(rgb.g)),
    b: gammaToLinear(clamp01(rgb.b)),
  };
  const { L, a, b } = linearRgbToOklab(linear);
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}
function oklchToSrgbObj(o: Oklch): Rgb {
  const a = o.c * Math.cos((o.h * Math.PI) / 180);
  const b = o.c * Math.sin((o.h * Math.PI) / 180);
  const lin = oklabToLinearRgb({ L: o.l, a, b });
  return {
    r: clamp01(linearToGamma(lin.r)),
    g: clamp01(linearToGamma(lin.g)),
    b: clamp01(linearToGamma(lin.b)),
  };
}
function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (c: number) =>
    Math.round(clamp01(c) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function fmtOklch(o: Oklch): string {
  return `oklch(${(o.l * 100).toFixed(1)}% ${o.c.toFixed(3)} ${o.h.toFixed(1)})`;
}

function firstStringSource(edge: EdgeHandle<string>): string {
  const first = Object.values(edge.source)[0];
  const v = first?.value();
  return typeof v === "string" ? v.trim() : "";
}

export function srgbToOklch(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() => {
    const src = firstStringSource(edge);
    if (!src) return edge.change("");
    if (src.toLowerCase().startsWith("oklch(")) return edge.change(src);
    const rgb = parseRgb(src);
    edge.change(rgb ? fmtOklch(srgbToOklchObj(rgb)) : src);
  });
}

export function oklchToSrgb(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() => {
    const src = firstStringSource(edge);
    if (!src) return edge.change("");
    if (src.startsWith("#") || src.toLowerCase().startsWith("rgb"))
      return edge.change(src);
    const o = parseOklch(src);
    edge.change(o ? rgbToHex(oklchToSrgbObj(o)) : src);
  });
}
