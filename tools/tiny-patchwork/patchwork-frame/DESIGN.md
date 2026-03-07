# ViewHeads Annotation Architecture - Design Document

## Problem Statement

### Current Behavior

When a user clicks on a history item in the history-view sidebar:

1. The history timeline publishes a `ViewHeads` annotation containing `{ beforeHeads, afterHeads }`
2. `PatchworkFrame` subscribes to this annotation and encodes the `afterHeads` into the document URL
3. The document URL changes from `automerge:abc123` to `automerge:abc123#heads=...`
4. This triggers the `doc-url` attribute change on the `<patchwork-view>` custom element
5. `patchwork-view` unconditionally calls `teardown()` then `init()`, completely remounting the view
6. All mounted tools are destroyed and recreated, losing transient state

### Impact

**Performance Issues:**
- Unnecessary teardown/init cycle on every history navigation
- Full re-render of document tools
- Re-initialization of complex editors (Tldraw, CodeMirror, etc.)

**User Experience Issues:**
- Loss of transient UI state (scroll position, cursor position, form data)
- Checkbox settings reset to defaults (e.g., "Highlight Changes" checkbox)
- Visible flicker/reload when clicking through history
- Slower navigation between historical states

**Architectural Issues:**
- ViewHeads is **presentation state** (which version to display), not **document identity**
- Mixes concerns: URL should identify the document, not the view state
- Inconsistent with annotation-based architecture used elsewhere (e.g., `HighlightChangesCheckbox`)

### Code Locations

**Root Cause Chain:**

1. **History item click** → `tools/sidebars/history-view/src/components/HistoryList.tsx:34`
2. **ViewHeads state update** → `tools/sidebars/history-view/src/hooks/useHistorySelection.ts:29`
3. **Annotation published** → `tools/sidebars/history-view/src/hooks/useViewHeadsAnnotation.ts:50`
4. **URL modification** → `tools/tiny-patchwork/patchwork-frame/src/PatchworkFrame.tsx:238-242`
5. **Attribute change** → `tools/tiny-patchwork/patchwork-frame/src/PatchworkFrame.tsx:392`
6. **Unconditional remount** → `core/elements/src/patchwork-view.ts:141`

## Proposed Solution: Annotation-Based ViewHeads

### Core Principle

**ViewHeads should remain in the annotation layer and never modify the document URL.**

Tools that need to display historical versions should subscribe to the `ViewHeads` annotation directly and create viewed document handles reactively, without remounting.

### Architecture

```
User clicks history item
    ↓
History timeline publishes ViewHeads annotation
    ↓
    ├─→ PatchworkFrame: IGNORES ViewHeads (URL unchanged)
    │   Document view stays mounted
    │
    ├─→ Document tools: Subscribe to ViewHeads annotation
    │   Create handle.view(heads) reactively
    │   Re-render with historical data (no remount)
    │
    └─→ HighlightChangesCheckbox: Computes diffs
        Shows visual highlights
```

### Comparison: Current vs Proposed

| Aspect | Current (URL-Based) | Proposed (Annotation-Based) |
|--------|---------------------|------------------------------|
| ViewHeads location | Encoded in document URL | In annotation context only |
| URL changes | Yes, on every history click | No, URL stays constant |
| Tools remount | Yes, full teardown/init | No, tools stay mounted |
| State preservation | Lost on remount | Preserved across navigation |
| Tool complexity | Simple (just use docUrl) | Moderate (subscribe to annotation) |
| Migration effort | N/A | Incremental, tool-by-tool |
| Architectural purity | Mixed concerns | Clean separation |

## Benefits

### Performance Benefits

1. **No Remounting:** Tools stay mounted when navigating history, avoiding expensive teardown/init cycles
2. **Faster Navigation:** Switching between historical states is just a handle view change, not a full reload
3. **Incremental Rendering:** Tools can optimize rendering of historical data vs full re-init

### User Experience Benefits

1. **State Preservation:** Scroll position, cursor position, selection, and other transient state is maintained
2. **No Flicker:** Smooth transitions between historical states without visible reload
3. **Persistent Settings:** UI controls (like "Highlight Changes" checkbox) maintain their state
4. **Responsive UI:** No lag when clicking through history

### Architectural Benefits

1. **Separation of Concerns:** URL represents document identity, annotations represent view state
2. **Consistent Pattern:** Aligns with existing annotation-based architecture (e.g., `HighlightChangesCheckbox`)
3. **Proven Approach:** `HighlightChangesCheckbox` already demonstrates this pattern works perfectly
4. **Composable:** Multiple tools can independently respond to ViewHeads without coordination
5. **Future-Proof:** Sets up proper pattern for other temporal features (branching, merging, etc.)

### Developer Benefits

1. **Incremental Migration:** Update tools one at a time, no big-bang rewrite
2. **Graceful Degradation:** Tools that don't support ViewHeads simply show current state
3. **Reusable Hooks:** `useViewedHandle()` pattern can be shared across tools
4. **Clear Intent:** Tool code explicitly shows when it supports history viewing

## Drawbacks

### Implementation Complexity

1. **Tool Updates Required:** Each tool that should support history viewing needs code changes
   - Estimated 15-20 minutes per tool
   - Requires understanding of annotation system
   - Need to handle both current and historical views

2. **More Complex Tool Code:** Tools must:
   - Subscribe to annotations
   - Create viewed handles
   - Handle reactive updates
   - Compared to simple `docUrl` prop, this is more code

3. **Learning Curve:** Tool developers need to understand:
   - Annotation system
   - ViewHeads semantic
   - Handle views API
   - Reactive patterns

### Temporary Transition State

1. **Incomplete Support:** During migration, some tools show current state while others show historical
   - May confuse users ("why does editor show current but canvas shows history?")
   - Need to document which tools support ViewHeads
   - Consider UI indicators for ViewHeads-aware tools

2. **Testing Complexity:** Need to test:
   - Tools with ViewHeads support
   - Tools without ViewHeads support
   - Mixed scenarios
   - Edge cases (missing annotations, malformed heads, etc.)

### Potential Edge Cases

1. **Handle View Caching:** Need to verify Automerge handle views don't have memory leaks or cache issues
2. **Read-Only Views:** Some tools might not handle read-only viewed handles well
3. **Concurrent Edits:** If user edits current doc while viewing history (unlikely but possible)

## Required Changes

### Phase 1: Stop Document Remounting (Critical Fix)

**Priority:** HIGH
**Estimated Time:** 10 minutes
**Risk:** LOW

**File:** `tools/tiny-patchwork/patchwork-frame/src/PatchworkFrame.tsx`

**Current Code (lines 224-244):**
```typescript
const viewHeads = createMemo(() =>
  selectedDocAnnotations()?.lookup(ViewHeads)
);

const selectedDocUrl = createMemo(() => {
  const view = selectedView();
  if (!view?.url) {
    return undefined;
  }

  const heads = viewHeads();
  if (!heads) {
    return view.url;
  }

  const currentDocumentId = parseAutomergeUrl(view.url).documentId;
  return stringifyAutomergeUrl({
    documentId: currentDocumentId,
    heads: encodeHeads(heads.afterHeads), // ← PROBLEM: Encodes heads into URL
  });
});
```

**New Code:**
```typescript
const selectedDocUrl = createMemo(() => selectedView()?.url);
```

**Impact:**
- Clicking history items will NO LONGER trigger remounting
- Document URL stays constant (no #heads fragment)
- Tools will show current state until they're updated to support ViewHeads
- HighlightChangesCheckbox continues to work (it already uses annotations)

### Phase 2: Create Reusable ViewHeads Hooks

**Priority:** MEDIUM
**Estimated Time:** 30 minutes
**Risk:** LOW

**New File:** `packages/patchwork-react/src/useViewHeads.ts`

```typescript
import { useMemo } from "react";
import { DocHandle } from "@automerge/automerge-repo";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import { annotations } from "@inkandswitch/annotations-context";
import { ref } from "@inkandswitch/patchwork-refs";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import { encodeHeads } from "@automerge/automerge-repo";

/**
 * Subscribe to ViewHeads annotation for a document handle.
 * Returns the ViewHeads annotation if present, null otherwise.
 */
export function useViewHeads<T>(handle: DocHandle<T>) {
  const docRef = useMemo(() => ref(handle), [handle]);
  const annotationsOnRef = useSubscribe(annotations.onRef(docRef));
  const viewHeads = annotationsOnRef?.lookup(ViewHeads);

  return viewHeads ?? null;
}

/**
 * Returns a viewed handle when ViewHeads annotation is present,
 * otherwise returns the base handle.
 *
 * Use this hook when your tool should display historical versions
 * when the user navigates the history timeline.
 *
 * @example
 * function MyTool({ docUrl }) {
 *   const handle = useDocHandle(docUrl);
 *   const viewedHandle = useViewedHandle(handle); // ← Respects ViewHeads
 *   const doc = useDocument(viewedHandle);
 *   // ... render doc
 * }
 */
export function useViewedHandle<T>(handle: DocHandle<T>): DocHandle<T> {
  const viewHeads = useViewHeads(handle);

  return useMemo(() => {
    if (!viewHeads?.afterHeads) {
      return handle;
    }
    return handle.view(encodeHeads(viewHeads.afterHeads));
  }, [handle, viewHeads]);
}
```

**New File:** `packages/patchwork-solid/src/useViewHeads.ts`

```typescript
import { createMemo } from "solid-js";
import { DocHandle } from "@automerge/automerge-repo";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import { annotations } from "@inkandswitch/annotations-context";
import { ref } from "@inkandswitch/patchwork-refs";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { encodeHeads } from "@automerge/automerge-repo";

/**
 * Subscribe to ViewHeads annotation for a document handle (SolidJS version).
 */
export function useViewHeads<T>(handle: DocHandle<T>) {
  const docRef = createMemo(() => ref(handle));
  const annotationsOnRef = useSubscribe(() => annotations.onRef(docRef()));

  return createMemo(() => annotationsOnRef()?.lookup(ViewHeads) ?? null);
}

/**
 * Returns a viewed handle when ViewHeads annotation is present (SolidJS version).
 */
export function useViewedHandle<T>(handle: DocHandle<T>) {
  const viewHeads = useViewHeads(handle);

  return createMemo(() => {
    const heads = viewHeads();
    if (!heads?.afterHeads) {
      return handle;
    }
    return handle.view(encodeHeads(heads.afterHeads));
  });
}
```

**Impact:**
- Provides reusable pattern for tools to support ViewHeads
- Encapsulates annotation subscription logic
- Consistent API across React and SolidJS

### Phase 3: Update Tldraw Tool

**Priority:** HIGH (flagship editor tool)
**Estimated Time:** 15 minutes
**Risk:** MEDIUM (complex tool)

**File:** `tools/editors/tldraw4/src/tool.tsx`

**Current Code (~line 70):**
```typescript
export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const contactInfo = useContactInfo();
  const store = useAutomergeStore({
    handle: handle,  // ← Uses base handle
    userId: contactInfo.userId
  });

  // ... rest of component
}
```

**New Code:**
```typescript
import { useViewedHandle } from "@inkandswitch/patchwork-react";

export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const viewedHandle = useViewedHandle(handle); // ← NEW: Respects ViewHeads
  const contactInfo = useContactInfo();
  const store = useAutomergeStore({
    handle: viewedHandle,  // ← Changed to use viewed handle
    userId: contactInfo.userId
  });

  // ... rest of component
}
```

**Impact:**
- Tldraw canvas will display historical document state when navigating history
- No remounting, smooth transitions
- Current edits still work (no ViewHeads when editing)

### Phase 4: Update Other Editor Tools (Optional/Incremental)

**Priority:** MEDIUM
**Estimated Time:** 15-20 minutes per tool
**Risk:** MEDIUM

Tools to consider updating:
- CodeMirror-based editors (`tools/editors/codemirror-*`)
- Canvas/drawing tools
- Any viewer that should show historical state

**Pattern for each tool:**
1. Import `useViewedHandle` (or `useViewHeads` for custom logic)
2. Wrap handle: `const viewedHandle = useViewedHandle(handle)`
3. Use `viewedHandle` instead of `handle` throughout
4. Test with history navigation

**Note:** Tools can be updated incrementally. Tools without ViewHeads support will simply show the current document state, which is acceptable fallback behavior.

### Phase 5: Documentation

**Priority:** MEDIUM
**Estimated Time:** 30 minutes
**Risk:** LOW

**File:** `docs/architecture/view-heads-annotation.md` (or similar)

**Content:**
- Explain ViewHeads annotation purpose
- Document the `useViewedHandle` pattern
- Provide examples for React and SolidJS
- List which tools support ViewHeads
- Migration guide for updating tools
- Troubleshooting common issues

## Implementation Method

### Step-by-Step Implementation

#### Step 1: Remove ViewHeads from URL (10 min)

1. Open `tools/tiny-patchwork/patchwork-frame/src/PatchworkFrame.tsx`
2. Locate lines 224-244 (viewHeads and selectedDocUrl memos)
3. Delete the entire `viewHeads` memo
4. Replace `selectedDocUrl` memo with: `const selectedDocUrl = createMemo(() => selectedView()?.url);`
5. Save file

**Verification:**
- Build should succeed
- Opening app should work normally
- Clicking history items should NOT cause remounting
- Console should NOT show "Received open document event"
- Tools will show current state (not historical yet)

#### Step 2: Create React Hook (15 min)

1. Create `packages/patchwork-react/src/useViewHeads.ts`
2. Implement `useViewHeads` and `useViewedHandle` as shown above
3. Export from `packages/patchwork-react/src/index.ts`:
   ```typescript
   export { useViewHeads, useViewedHandle } from './useViewHeads';
   ```
4. Build package: `npm run build` (or your build command)

**Verification:**
- Package builds successfully
- Types are exported correctly
- No import errors

#### Step 3: Create SolidJS Hook (15 min)

1. Create `packages/patchwork-solid/src/useViewHeads.ts`
2. Implement SolidJS version as shown above
3. Export from `packages/patchwork-solid/src/index.ts`
4. Build package

**Verification:**
- Package builds successfully
- Types are exported correctly

#### Step 4: Update Tldraw (15 min)

1. Open `tools/editors/tldraw4/src/tool.tsx`
2. Add import: `import { useViewedHandle } from "@inkandswitch/patchwork-react";`
3. Add line: `const viewedHandle = useViewedHandle(handle);`
4. Replace `handle` with `viewedHandle` in `useAutomergeStore` call
5. Save and rebuild tool

**Verification:**
- Tool builds successfully
- Opening a Tldraw document works
- Clicking history items shows historical canvas state
- No errors in console
- Performance is smooth (no remounting)

#### Step 5: Update Other Tools (incremental)

Repeat pattern for each tool:
1. Import `useViewedHandle`
2. Wrap handle
3. Test with history navigation

#### Step 6: Write Documentation

1. Document the architecture decision
2. Provide usage examples
3. List supported tools
4. Create migration guide

### Testing Strategy

#### Unit Testing

**Test:** `useViewedHandle` hook behavior
- Returns base handle when no ViewHeads annotation
- Returns viewed handle when ViewHeads annotation present
- Updates reactively when ViewHeads changes

**Test:** PatchworkFrame URL behavior
- URL does NOT change when ViewHeads annotation published
- URL does change when different document selected

#### Integration Testing

**Test:** History navigation without remounting
1. Open document in editor tool
2. Add console.log to tool initialization
3. Click history item
4. Verify only ONE console.log (no remount)
5. Verify tool shows historical state

**Test:** Checkbox state persistence
1. Open document
2. Uncheck "Highlight Changes" checkbox
3. Click different history items
4. Verify checkbox stays unchecked

**Test:** Mixed tool support
1. Open document with ViewHeads-aware tool (Tldraw)
2. Open same document with non-aware tool
3. Navigate history
4. Verify Tldraw shows historical, other shows current
5. Verify no errors

#### Performance Testing

**Test:** Navigation speed
1. Create document with 100+ history items
2. Rapidly click through history
3. Verify smooth performance, no lag
4. Compare before/after remounting fix

**Test:** Memory usage
1. Navigate through history extensively
2. Monitor memory usage
3. Verify no memory leaks from handle views

### Migration Path

#### Immediate (Day 1)

1. ✅ Implement Phase 1: Remove ViewHeads from URL
   - **Effect:** No more remounting, checkbox works
   - **Limitation:** Tools don't show historical state yet

#### Week 1

2. ✅ Implement Phase 2: Create hooks
3. ✅ Implement Phase 3: Update Tldraw
   - **Effect:** Tldraw shows historical state smoothly

#### Week 2-4

4. ⏳ Implement Phase 4: Update other tools incrementally
   - **Priority order:**
     1. CodeMirror (if used for viewing documents)
     2. Canvas/drawing tools
     3. Specialized viewers
     4. Read-only tools (lower priority)

#### Ongoing

5. ⏳ Document pattern and update as new tools are created
6. ⏳ Monitor for issues and refine approach

### Rollback Plan

If issues arise, the change can be easily rolled back:

**Rollback Step 1:** Restore PatchworkFrame
- Revert `PatchworkFrame.tsx` to include ViewHeads in URL
- **Effect:** Back to original behavior (remounting)

**Rollback Step 2:** Remove tool updates (optional)
- Revert individual tool changes
- Or leave them (they'll work fine with URL-based approach too)

**Risk:** Very low - changes are isolated and well-defined

## Alternative Approaches Considered

### Alternative 1: Smart patchwork-view (Detect Heads-Only Changes)

**Idea:** Make `patchwork-view` detect when only heads changed (not doc ID) and avoid remounting.

**Why Rejected:**
- Tools receive handle in initialization, not designed for handle updates
- React/Solid hooks (like `useDocument(docUrl)`) wouldn't detect handle changes
- Would require major tool API redesign
- Mixing URL and annotation approaches

### Alternative 2: Hybrid - Optional ViewHeads in Tool API

**Idea:** Extend ToolElement API with `viewHeads()` accessor, keep URL-based approach but optimize patchwork-view.

**Why Rejected:**
- More complex API surface
- Would require polling or custom subscription mechanism
- Mixing URL and annotation approaches
- Doesn't fully solve architectural issue

### Alternative 3: URL-Free patchwork-view

**Idea:** Make patchwork-view accept handles/refs instead of URLs.

**Why Rejected:**
- Too radical, requires complete API redesign
- Not viable for incremental improvement
- Would break all existing tools

## Summary

### The Change in One Sentence

**Remove ViewHeads from document URLs and have tools subscribe to ViewHeads annotations to display historical versions without remounting.**

### Key Decisions

1. **Annotation-Based:** ViewHeads lives only in annotation context, never in URLs
2. **Incremental:** Tools updated one-by-one, no breaking changes
3. **Graceful:** Tools without ViewHeads support show current state (acceptable)
4. **Reusable:** Shared `useViewedHandle` hook for consistent pattern

### Success Criteria

- ✅ Clicking history items does NOT remount document views
- ✅ Checkbox state persists across history navigation
- ✅ No "open document event" console logs from history clicks
- ✅ Tldraw and updated tools show historical state correctly
- ✅ Performance is noticeably smoother
- ✅ No memory leaks or performance degradation

### Timeline

- **Immediate fix:** 10 minutes (Phase 1)
- **Full Tldraw support:** 40 minutes (Phases 1-3)
- **Complete migration:** 2-4 weeks (all phases, all tools)

### Recommendation

**Proceed with this approach.** It provides:
- Immediate fix for remounting issue
- Clean architectural foundation
- Incremental migration path
- Proven pattern
- Low risk

The benefits far outweigh the implementation cost, and the approach is architecturally sound for long-term maintainability.
