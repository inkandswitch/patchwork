# @inkandswitch/patchwork-refs

## 0.1.3

### Patch Changes

- 398dffc: - Add `isEquivalent()` method to compare refs with different addressing (index vs pattern)
  - Cache key now includes heads
  - `fromUrl` and `fromString` use cached ref factory

## 0.1.2

### Patch Changes

- 443451b: ensure 'dist' folder is properly included in the published package

## 0.1.1

### Patch Changes

- d76fcc7: Rename @patchwork/refs to @inkandswitch/patchwork-refs

## 0.1.0

### Minor Changes

- 4ba3100: - Added `remove()` method for deleting from objects, arrays, and text ranges
  - Added `isChildOf()` method for checking parent-child relationships
  - Added `rangePositions` getter for cursor range positions
  - `fromUrl()` now throws if documentId doesn't match handle
  - Exported `Ref` type from main index
  - Ref cache now shared via globalThis across library instances
