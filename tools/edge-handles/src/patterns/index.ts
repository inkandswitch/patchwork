/**
 * A small library of reference transforms.
 *
 * Each pattern is self-contained — one file, one shape, no shared helpers —
 * so reading a few patterns reveals the universal `subscribe → read sources →
 * compute → change` loop. Copy and adapt freely; these are demo code and
 * documentation, not a framework.
 *
 * Patterns aren't a registry either: there's no `attach()` here, no
 * scheduler, no plugin glue. If you want those things, build them on top.
 */

export { identity } from "./identity.js";
export { derive } from "./derive.js";
export { sum } from "./sum.js";
export { template } from "./template.js";
export { upper, lower, slugify } from "./text.js";
export { markdownToHtml } from "./markdown.js";
export { srgbToOklch, oklchToSrgb } from "./color.js";
export { streamed } from "./streamed.js";
export { accumulator } from "./accumulator.js";
