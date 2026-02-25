/**
 * Post-build: copy elements.d.ts to dist and ensure index.d.ts references it
 * so consumers get JSX intrinsic element types for patchwork-view.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const reference = '/// <reference path="./elements.d.ts" />\n';

// Copy src/elements.d.ts to dist/
fs.copyFileSync(
  path.join(root, "src", "elements.d.ts"),
  path.join(dist, "elements.d.ts")
);

// Prepend reference to dist/index.d.ts so global JSX augmentations are loaded
const indexDtsPath = path.join(dist, "index.d.ts");
let indexDts = fs.readFileSync(indexDtsPath, "utf8");
if (!indexDts.includes('/// <reference path="./elements.d.ts" />')) {
  indexDts = reference + indexDts;
  fs.writeFileSync(indexDtsPath, indexDts);
}
