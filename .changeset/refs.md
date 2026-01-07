---
"@patchwork/refs": minor
---

- Added `remove()` method for deleting from objects, arrays, and text ranges
- Added `isChildOf()` method for checking parent-child relationships
- Added `rangePositions` getter for cursor range positions
- `fromUrl()` now throws if documentId doesn't match handle
- Exported `Ref` type from main index
- Ref cache now shared via globalThis across library instances

