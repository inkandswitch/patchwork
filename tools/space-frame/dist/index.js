(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode(`/*! tailwindcss v4.1.18 | MIT License | https://tailwindcss.com */
@layer properties {
  @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {
    *, :before, :after, ::backdrop {
      --tw-rotate-x: initial;
      --tw-rotate-y: initial;
      --tw-rotate-z: initial;
      --tw-skew-x: initial;
      --tw-skew-y: initial;
      --tw-border-style: solid;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-color: initial;
      --tw-shadow-alpha: 100%;
      --tw-inset-shadow: 0 0 #0000;
      --tw-inset-shadow-color: initial;
      --tw-inset-shadow-alpha: 100%;
      --tw-ring-color: initial;
      --tw-ring-shadow: 0 0 #0000;
      --tw-inset-ring-color: initial;
      --tw-inset-ring-shadow: 0 0 #0000;
      --tw-ring-inset: initial;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-outline-style: solid;
      --tw-blur: initial;
      --tw-brightness: initial;
      --tw-contrast: initial;
      --tw-grayscale: initial;
      --tw-hue-rotate: initial;
      --tw-invert: initial;
      --tw-opacity: initial;
      --tw-saturate: initial;
      --tw-sepia: initial;
      --tw-drop-shadow: initial;
      --tw-drop-shadow-color: initial;
      --tw-drop-shadow-alpha: 100%;
      --tw-drop-shadow-size: initial;
      --tw-backdrop-blur: initial;
      --tw-backdrop-brightness: initial;
      --tw-backdrop-contrast: initial;
      --tw-backdrop-grayscale: initial;
      --tw-backdrop-hue-rotate: initial;
      --tw-backdrop-invert: initial;
      --tw-backdrop-opacity: initial;
      --tw-backdrop-saturate: initial;
      --tw-backdrop-sepia: initial;
      --tw-ease: initial;
    }
  }
}

@layer theme {
  :root, :host {
    --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    --ease-in-out: cubic-bezier(.4, 0, .2, 1);
    --default-transition-duration: .15s;
    --default-transition-timing-function: cubic-bezier(.4, 0, .2, 1);
    --default-font-family: var(--font-sans);
    --default-mono-font-family: var(--font-mono);
  }
}

@layer base {
  *, :after, :before, ::backdrop {
    box-sizing: border-box;
    border: 0 solid;
    margin: 0;
    padding: 0;
  }

  ::file-selector-button {
    box-sizing: border-box;
    border: 0 solid;
    margin: 0;
    padding: 0;
  }

  html, :host {
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    line-height: 1.5;
    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
    font-feature-settings: var(--default-font-feature-settings, normal);
    font-variation-settings: var(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }

  hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }

  abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }

  h1, h2, h3, h4, h5, h6 {
    font-size: inherit;
    font-weight: inherit;
  }

  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    -webkit-text-decoration: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }

  b, strong {
    font-weight: bolder;
  }

  code, kbd, samp, pre {
    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
    font-feature-settings: var(--default-mono-font-feature-settings, normal);
    font-variation-settings: var(--default-mono-font-variation-settings, normal);
    font-size: 1em;
  }

  small {
    font-size: 80%;
  }

  sub, sup {
    vertical-align: baseline;
    font-size: 75%;
    line-height: 0;
    position: relative;
  }

  sub {
    bottom: -.25em;
  }

  sup {
    top: -.5em;
  }

  table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }

  :-moz-focusring {
    outline: auto;
  }

  progress {
    vertical-align: baseline;
  }

  summary {
    display: list-item;
  }

  ol, ul, menu {
    list-style: none;
  }

  img, svg, video, canvas, audio, iframe, embed, object {
    vertical-align: middle;
    display: block;
  }

  img, video {
    max-width: 100%;
    height: auto;
  }

  button, input, select, optgroup, textarea {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    opacity: 1;
    background-color: #0000;
    border-radius: 0;
  }

  ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    opacity: 1;
    background-color: #0000;
    border-radius: 0;
  }

  :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }

  :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }

  ::file-selector-button {
    margin-inline-end: 4px;
  }

  ::placeholder {
    opacity: 1;
  }

  @supports (not ((-webkit-appearance: -apple-pay-button))) or (contain-intrinsic-size: 1px) {
    ::placeholder {
      color: currentColor;
    }

    @supports (color: color-mix(in lab, red, red)) {
      ::placeholder {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
  }

  textarea {
    resize: vertical;
  }

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-date-and-time-value {
    min-height: 1lh;
    text-align: inherit;
  }

  ::-webkit-datetime-edit {
    display: inline-flex;
  }

  ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }

  ::-webkit-datetime-edit {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-year-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-month-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-day-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-hour-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-minute-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-second-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-millisecond-field {
    padding-block: 0;
  }

  ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }

  ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }

  :-moz-ui-invalid {
    box-shadow: none;
  }

  button, input:where([type="button"], [type="reset"], [type="submit"]) {
    appearance: button;
  }

  ::file-selector-button {
    appearance: button;
  }

  ::-webkit-inner-spin-button {
    height: auto;
  }

  ::-webkit-outer-spin-button {
    height: auto;
  }

  [hidden]:where(:not([hidden="until-found"])) {
    display: none !important;
  }
}

@layer components;

@layer utilities {
  .visible {
    visibility: visible;
  }

  .fixed {
    position: fixed;
  }

  .relative {
    position: relative;
  }

  .static {
    position: static;
  }

  .container {
    width: 100%;
  }

  @media (min-width: 40rem) {
    .container {
      max-width: 40rem;
    }
  }

  @media (min-width: 48rem) {
    .container {
      max-width: 48rem;
    }
  }

  @media (min-width: 64rem) {
    .container {
      max-width: 64rem;
    }
  }

  @media (min-width: 80rem) {
    .container {
      max-width: 80rem;
    }
  }

  @media (min-width: 96rem) {
    .container {
      max-width: 96rem;
    }
  }

  .block {
    display: block;
  }

  .flex {
    display: flex;
  }

  .grid {
    display: grid;
  }

  .hidden {
    display: none;
  }

  .inline {
    display: inline;
  }

  .table {
    display: table;
  }

  .flex-shrink, .shrink {
    flex-shrink: 1;
  }

  .flex-grow, .grow {
    flex-grow: 1;
  }

  .border-collapse {
    border-collapse: collapse;
  }

  .transform {
    transform: var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, );
  }

  .resize {
    resize: both;
  }

  .rounded {
    border-radius: .25rem;
  }

  .border {
    border-style: var(--tw-border-style);
    border-width: 1px;
  }

  .underline {
    text-decoration-line: underline;
  }

  .shadow {
    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);
    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  }

  .outline {
    outline-style: var(--tw-outline-style);
    outline-width: 1px;
  }

  .filter {
    filter: var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, );
  }

  .backdrop-filter {
    -webkit-backdrop-filter: var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, );
    backdrop-filter: var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, );
  }

  .transition {
    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;
    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
    transition-duration: var(--tw-duration, var(--default-transition-duration));
  }

  .ease-in-out {
    --tw-ease: var(--ease-in-out);
    transition-timing-function: var(--ease-in-out);
  }
}

patchwork-space#space-root {
  gap: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  transition: gap .35s, padding .35s;
}

patchwork-space#space-root[editing] {
  background-image: radial-gradient(circle, currentColor .7px, #0000 .7px);
  gap: 6px;
  padding: 8px;
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-space#space-root[editing] {
    background-image: radial-gradient(circle, color-mix(in oklch, currentColor 15%, transparent) .7px, transparent .7px);
  }
}

patchwork-space#space-root[editing] {
  background-size: 16px 16px;
}

patchwork-space > patchwork-view {
  width: 100%;
  height: 100%;
  display: block;
}

patchwork-space > patchwork-space {
  gap: 0;
  padding: 0;
  transition: border-radius .3s, box-shadow .3s, gap .3s, padding .3s;
}

patchwork-space[editing] > patchwork-space {
  --depth-chroma: clamp(0, calc((var(--depth, 0)  - 1) * .15), .15);
  --depth-hue: calc(250 - max(0, var(--depth, 0)  - 2) * 40);
  --depth-color: oklch(.55 var(--depth-chroma) var(--depth-hue));
  box-shadow: 0 0 0 1.5px var(--depth-color);
  border-radius: 10px;
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-space[editing] > patchwork-space {
    box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--depth-color) 45%, transparent);
  }
}

patchwork-space[editing] > patchwork-space {
  overflow: hidden;
}

patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
  background: var(--depth-color);
  gap: 6px;
  padding: 4px;
  overflow: visible;
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
    background: color-mix(in oklch, var(--depth-color) 8%, transparent);
  }
}

patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
  box-shadow: 0 0 0 1.5px var(--depth-color), inset 0 0 0 1px var(--depth-color), inset 0 2px 12px var(--depth-color);
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
    box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--depth-color) 45%, transparent), inset 0 0 0 1px color-mix(in oklch, var(--depth-color) 10%, transparent), inset 0 2px 12px color-mix(in oklch, var(--depth-color) 6%, transparent);
  }
}

@media (prefers-color-scheme: light) {
  patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
    background: var(--depth-color);
  }

  @supports (color: color-mix(in lab, red, red)) {
    patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
      background: color-mix(in oklch, var(--depth-color) 10%, transparent);
    }
  }

  patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
    box-shadow: 0 0 0 1.5px var(--depth-color), inset 0 0 0 1px var(--depth-color), inset 0 2px 12px var(--depth-color);
  }

  @supports (color: color-mix(in lab, red, red)) {
    patchwork-space[editing] > patchwork-space:has( > patchwork-space) {
      box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--depth-color) 45%, transparent), inset 0 0 0 1px color-mix(in oklch, var(--depth-color) 12%, transparent), inset 0 2px 12px color-mix(in oklch, var(--depth-color) 8%, transparent);
    }
  }
}

patchwork-space {
  --drag-x: 0px;
  --drag-y: 0px;
  transform: translate(var(--drag-x), var(--drag-y));
  transition: transform .2s, border-radius .3s, box-shadow .3s, border-color .3s;
}

patchwork-space[aria-grabbed="true"] {
  z-index: 999999;
  opacity: .85;
  transition: none;
  border-radius: 12px !important;
  box-shadow: 0 16px 48px #0000004d !important;
}

patchwork-space.drop-target {
  transition: box-shadow .1s !important;
  box-shadow: 0 0 0 2px oklch(60% .2 250), 0 0 16px oklch(60% .2 250 / .25) !important;
}

.space-drop-indicator {
  z-index: 100000;
  pointer-events: none;
  background: oklch(60% .2 250);
  border-radius: 3px;
  transition: left .1s, top .1s, width .1s, height .1s;
  position: fixed;
  box-shadow: 0 0 8px oklch(60% .2 250 / .5);
}

.space-add-ghost {
  z-index: 100001;
  pointer-events: none;
  color: oklch(90% .05 250);
  white-space: nowrap;
  background: oklch(30% .15 250);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  position: fixed;
  transform: translate(-50%, -50%);
  box-shadow: 0 4px 16px #0000004d;
}

.space-empty-state {
  opacity: .5;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  display: flex;
}

.space-toolbar {
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  display: flex;
  overflow: hidden;
}

.space-toolbar-item {
  width: fit-content !important;
  height: 32px !important;
  display: flex !important;
  overflow: hidden !important;
}

.space-drag-handle {
  cursor: grab;
  z-index: 11;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
  opacity: 0;
  height: 22px;
  color: var(--depth-color, currentColor);
  border-radius: 8px 8px 0 0;
  justify-content: center;
  align-items: center;
  transition: opacity .15s;
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-drag-handle {
    color: var(--depth-color, color-mix(in oklch, currentColor 50%, transparent));
  }
}

.space-drag-handle {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E"), var(--depth-color, currentColor);
}

@supports (color: color-mix(in lab, red, red)) {
  .space-drag-handle {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E"), color-mix(in oklch, var(--depth-color, currentColor) 10%, transparent);
  }
}

.space-drag-handle {
  background-size: 200px 40px, auto;
}

patchwork-space[editing] > patchwork-space > .space-drag-handle {
  opacity: .8;
}

.space-drag-handle:hover {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E"), var(--depth-color, currentColor);
  opacity: 1 !important;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-drag-handle:hover {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E"), color-mix(in oklch, var(--depth-color, currentColor) 16%, transparent);
  }
}

.space-drag-handle:hover {
  background-size: 200px 40px, auto;
}

.space-drag-handle:active {
  cursor: grabbing;
}

.space-handle-close {
  width: 18px;
  height: 18px;
  color: inherit;
  cursor: pointer;
  opacity: .8;
  pointer-events: auto;
  background: none;
  border: none;
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  padding: 0;
  transition: opacity .1s, background .1s;
  display: flex;
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
}

.space-handle-close:hover {
  opacity: 1;
  background: var(--depth-color, currentColor);
}

@supports (color: color-mix(in lab, red, red)) {
  .space-handle-close:hover {
    background: color-mix(in oklch, var(--depth-color, currentColor) 25%, transparent);
  }
}

.edit-overlay {
  pointer-events: none;
  z-index: 1000;
  position: fixed;
  inset: 0;
}

.edit-overlay > * {
  pointer-events: auto;
}

.edit-controls-bar {
  background: currentColor;
  border-radius: 10px;
  align-items: center;
  gap: 2px;
  padding: 3px;
  display: flex;
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

@supports (color: color-mix(in lab, red, red)) {
  .edit-controls-bar {
    background: color-mix(in oklch, currentColor 6%, Canvas);
  }
}

.edit-controls-bar {
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  box-shadow: 0 0 0 1px, 0 4px 16px #0000001a;
}

@supports (color: color-mix(in lab, red, red)) {
  .edit-controls-bar {
    box-shadow: 0 0 0 1px color-mix(in oklch, currentColor 10%, transparent), 0 4px 16px #0000001a;
  }
}

.edit-controls-bar {
  z-index: 1001;
  color: canvastext;
}

.edit-ctrl-btn {
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
  background: none;
  border: none;
  border-radius: 7px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 500;
  transition: background .12s;
}

.edit-ctrl-btn:hover {
  background: currentColor;
}

@supports (color: color-mix(in lab, red, red)) {
  .edit-ctrl-btn:hover {
    background: color-mix(in oklch, currentColor 8%, transparent);
  }
}

.edit-ctrl-btn--primary {
  color: #fff;
  background: oklch(55% .2 250);
  font-weight: 600;
}

.edit-ctrl-btn--primary:hover {
  background: oklch(50% .22 250);
}

.edit-ctrl-btn--add {
  color: oklch(55% .2 250);
  font-weight: 600;
}

.edit-ctrl-btn--add:hover {
  background: oklch(55% .2 250 / .08);
}

.edit-ctrl-sep {
  background: currentColor;
  width: 1px;
  height: 16px;
}

@supports (color: color-mix(in lab, red, red)) {
  .edit-ctrl-sep {
    background: color-mix(in oklch, currentColor 12%, transparent);
  }
}

.edit-ctrl-sep {
  flex-shrink: 0;
  margin: 0 2px;
}

patchwork-preview {
  color: canvastext;
  background: canvas;
}

.space-picker {
  background: currentColor;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 16px;
  display: flex;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-picker {
    background: color-mix(in oklch, currentColor 3%, Canvas);
  }
}

.space-picker {
  color: canvastext;
}

.space-picker-title {
  opacity: .5;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 500;
}

.space-picker-option {
  border: 1px solid;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  display: flex;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-picker-option {
    border: 1px solid color-mix(in oklch, currentColor 10%, transparent);
  }
}

.space-picker-option {
  color: inherit;
  cursor: pointer;
  background: none;
  border-radius: 8px;
  min-width: 160px;
  font-size: 13px;
  transition: background .12s, border-color .12s;
}

.space-picker-option:hover {
  background: currentColor;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-picker-option:hover {
    background: color-mix(in oklch, currentColor 6%, transparent);
  }
}

.space-picker-option:hover {
  border-color: currentColor;
}

@supports (color: color-mix(in lab, red, red)) {
  .space-picker-option:hover {
    border-color: color-mix(in oklch, currentColor 20%, transparent);
  }
}

.space-picker-icon {
  text-align: center;
  width: 20px;
  font-size: 16px;
}

.pipe-center-btn {
  z-index: 11;
  border: 1.5px solid var(--depth-color, currentColor);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-center-btn {
    border: 1.5px solid color-mix(in oklch, var(--depth-color, currentColor) 40%, transparent);
  }
}

.pipe-center-btn {
  color: var(--depth-color, currentColor);
  background: canvas;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-center-btn {
    color: color-mix(in oklch, var(--depth-color, currentColor) 70%, CanvasText);
  }
}

.pipe-center-btn {
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  line-height: 1;
  transition: opacity .15s, transform .15s, background .15s, border-color .15s;
  display: flex;
}

patchwork-pipe[editing]:hover .pipe-center-btn {
  opacity: 1;
}

patchwork-pipe[editing][transform] .pipe-center-btn {
  opacity: .7;
  color: oklch(55% .2 250);
  border-color: oklch(55% .2 250 / .6);
}

patchwork-pipe[editing][transform]:hover .pipe-center-btn {
  opacity: 1;
}

.pipe-center-btn:hover {
  color: #fff;
  background: oklch(55% .2 250);
  border-color: oklch(55% .2 250);
  transform: translate(-50%, -50%)scale(1.15);
}

.pipe-indicator {
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  z-index: 10;
  background: oklch(55% .2 250);
  border: none;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  transition: transform .15s;
}

.pipe-indicator:hover {
  transform: scale(1.1);
}

.pipe-editor {
  z-index: 1002;
  background: currentColor;
  position: absolute;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-editor {
    background: color-mix(in oklch, currentColor 5%, Canvas);
  }
}

.pipe-editor {
  border-radius: 12px;
  box-shadow: 0 8px 32px #00000026, 0 0 0 1px;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-editor {
    box-shadow: 0 8px 32px #00000026, 0 0 0 1px color-mix(in oklch, currentColor 10%, transparent);
  }
}

.pipe-editor {
  color: canvastext;
  min-width: 240px;
  overflow: visible;
}

.pipe-editor-header {
  border-bottom: 1px solid;
  padding: 10px 14px;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-editor-header {
    border-bottom: 1px solid color-mix(in oklch, currentColor 10%, transparent);
  }
}

.pipe-editor-header {
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  display: flex;
}

.pipe-editor-header-actions {
  align-items: center;
  gap: 2px;
  display: flex;
}

.pipe-editor-close, .pipe-editor-expand-btn, .pipe-editor-clear-btn {
  cursor: pointer;
  color: inherit;
  opacity: .5;
  background: none;
  border: none;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 14px;
  line-height: 1;
}

.pipe-editor-close:hover, .pipe-editor-expand-btn:hover {
  opacity: 1;
}

.pipe-editor-clear-btn {
  color: oklch(55% .25 25);
  opacity: .7;
}

.pipe-editor-clear-btn:hover {
  opacity: 1;
  background: oklch(55% .25 25 / .1);
}

.pipe-editor-body {
  padding: 4px;
}

.pipe-editor-empty {
  text-align: center;
  opacity: .5;
  padding: 12px;
  font-size: 13px;
}

.pipe-editor-picker-item {
  text-align: left;
  cursor: pointer;
  width: 100%;
  color: inherit;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  transition: background .1s;
  display: block;
}

.pipe-editor-picker-item:hover {
  background: currentColor;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-editor-picker-item:hover {
    background: color-mix(in oklch, currentColor 8%, transparent);
  }
}

.pipe-editor-picker-item.active {
  color: oklch(45% .2 250);
  background: oklch(55% .2 250 / .12);
  font-weight: 500;
}

patchwork-pipe {
  touch-action: none;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background .15s;
  position: relative;
}

patchwork-pipe[editing] {
  background: var(--depth-color, currentColor);
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-pipe[editing] {
    background: color-mix(in oklch, var(--depth-color, currentColor) 20%, transparent);
  }
}

patchwork-pipe[editing]:hover {
  background: var(--depth-color, currentColor);
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-pipe[editing]:hover {
    background: color-mix(in oklch, var(--depth-color, currentColor) 50%, transparent);
  }
}

patchwork-pipe[expanded] {
  border: 1px solid;
  border-radius: 8px;
  overflow: hidden;
  display: flex !important;
}

@supports (color: color-mix(in lab, red, red)) {
  patchwork-pipe[expanded] {
    border: 1px solid color-mix(in oklch, currentColor 10%, transparent);
  }
}

patchwork-pipe[expanded] {
  background: canvas;
}

.pipe-expanded-header {
  background: currentColor;
  justify-content: space-between;
  align-items: center;
  padding: 2px 8px;
  display: flex;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-expanded-header {
    background: color-mix(in oklch, currentColor 6%, Canvas);
  }
}

.pipe-expanded-header {
  border-bottom: 1px solid;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-expanded-header {
    border-bottom: 1px solid color-mix(in oklch, currentColor 10%, transparent);
  }
}

.pipe-expanded-header {
  color: currentColor;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
}

@supports (color: color-mix(in lab, red, red)) {
  .pipe-expanded-header {
    color: color-mix(in oklch, currentColor 60%, Canvas);
  }
}

.pipe-expanded-collapse {
  cursor: pointer;
  color: inherit;
  opacity: .6;
  background: none;
  border: none;
  padding: 2px 4px;
  font-size: 14px;
}

.pipe-expanded-collapse:hover {
  opacity: 1;
}

@property --tw-rotate-x {
  syntax: "*";
  inherits: false
}

@property --tw-rotate-y {
  syntax: "*";
  inherits: false
}

@property --tw-rotate-z {
  syntax: "*";
  inherits: false
}

@property --tw-skew-x {
  syntax: "*";
  inherits: false
}

@property --tw-skew-y {
  syntax: "*";
  inherits: false
}

@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}

@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-shadow-color {
  syntax: "*";
  inherits: false
}

@property --tw-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}

@property --tw-inset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-inset-shadow-color {
  syntax: "*";
  inherits: false
}

@property --tw-inset-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}

@property --tw-ring-color {
  syntax: "*";
  inherits: false
}

@property --tw-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-inset-ring-color {
  syntax: "*";
  inherits: false
}

@property --tw-inset-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-ring-inset {
  syntax: "*";
  inherits: false
}

@property --tw-ring-offset-width {
  syntax: "<length>";
  inherits: false;
  initial-value: 0;
}

@property --tw-ring-offset-color {
  syntax: "*";
  inherits: false;
  initial-value: #fff;
}

@property --tw-ring-offset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}

@property --tw-outline-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}

@property --tw-blur {
  syntax: "*";
  inherits: false
}

@property --tw-brightness {
  syntax: "*";
  inherits: false
}

@property --tw-contrast {
  syntax: "*";
  inherits: false
}

@property --tw-grayscale {
  syntax: "*";
  inherits: false
}

@property --tw-hue-rotate {
  syntax: "*";
  inherits: false
}

@property --tw-invert {
  syntax: "*";
  inherits: false
}

@property --tw-opacity {
  syntax: "*";
  inherits: false
}

@property --tw-saturate {
  syntax: "*";
  inherits: false
}

@property --tw-sepia {
  syntax: "*";
  inherits: false
}

@property --tw-drop-shadow {
  syntax: "*";
  inherits: false
}

@property --tw-drop-shadow-color {
  syntax: "*";
  inherits: false
}

@property --tw-drop-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}

@property --tw-drop-shadow-size {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-blur {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-brightness {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-contrast {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-grayscale {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-hue-rotate {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-invert {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-opacity {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-saturate {
  syntax: "*";
  inherits: false
}

@property --tw-backdrop-sepia {
  syntax: "*";
  inherits: false
}

@property --tw-ease {
  syntax: "*";
  inherits: false
}`));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const plugins = [
  {
    type: "patchwork:tool",
    id: "space-frame",
    tags: ["frame-tool"],
    name: "Space Frame",
    icon: "LayoutGrid",
    supportedDatatypes: ["account"],
    async load() {
      const { mountSpaceFrame } = await __vitePreload(async () => {
        const { mountSpaceFrame: mountSpaceFrame2 } = await import("./assets/space-frame-3YIqmUJ2.js");
        return { mountSpaceFrame: mountSpaceFrame2 };
      }, true ? [] : void 0, import.meta.url);
      return (handle, element) => {
        return mountSpaceFrame(handle, element, element.repo);
      };
    }
  },
  {
    type: "patchwork:transform",
    id: "passthrough",
    name: "Passthrough",
    async load() {
      return {
        run(input) {
          if (typeof input === "string") return input;
          if (input?.content && typeof input.content === "string")
            return input.content;
          return JSON.stringify(input, null, 2);
        }
      };
    }
  }
];
export {
  plugins
};
//# sourceMappingURL=index.js.map
