# Code Review: Patchwork Frame SolidJS Implementation

Reviewed: 2026-02-18

This document reviews the SolidJS implementation of the patchwork-frame tool, comparing it against the patterns established in the sideboard tool.

## Summary

The patchwork-frame implementation demonstrates a solid understanding of SolidJS fundamentals, but contains several anti-patterns, errors, and opportunities for improvement when compared to the established patterns in the sideboard codebase.

**Critical Issues:** 1
**Non-idiomatic Patterns:** 7
**Improvement Opportunities:** 12

---

## ✅ Correct Patterns

### 1. Non-reactive refs for DOM interaction (PatchworkFrame.tsx:94-96)
```typescript
let isResizing: "left" | "right" | null = null;
let dragStartPos: { x: number; y: number } | null = null;
let hasDragged = false;
```
**Good:** Using plain `let` variables for refs that don't need reactivity is the correct SolidJS pattern. This is explicitly documented in the code and avoids unnecessary reactive overhead.

### 2. Cleanup handlers with onCleanup
Throughout the code, `onCleanup` is properly used to clean up subscriptions and event listeners (e.g., PatchworkFrame.tsx:185-188, 221, 266-268).

### 3. Signal equality configuration (PatchworkFrame.tsx:203-206)
```typescript
const [selectedDocAnnotations, setSelectedDocAnnotations] = createSignal<any>(
  undefined,
  { equals: false }
);
```
**Good (with caveat):** Using `{ equals: false }` is appropriate when you need to force updates even when the reference doesn't change. However, the `any` type should be improved (see type safety issues below).

### 4. Keyed Show component (PatchworkFrame.tsx:387-397)
```typescript
<Show when={viewKey()} keyed>
  {(key) => {
    console.log("Mounting patchwork-view with key:", key);
    return <patchwork-view ... />
  }}
</Show>
```
**Good:** Using `keyed` with Show ensures proper unmounting/remounting when the view changes.

### 5. Async cancellation pattern (effects.ts:85, 454)
The use of `cancelled` flags for async operations with cleanup is the correct pattern for handling async operations in effects.

---

## ❌ Errors

### 1. **CRITICAL: Event listeners added in createEffect (PatchworkFrame.tsx:182-189)**
```typescript
createEffect(() => {
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });
});
```

**Problem:** This effect has no dependencies, so it will only run once, which is what's intended. However, using `createEffect` for this is misleading - it should use `onMount` instead.

**Fix:** Use `onMount` from solid-js:
```typescript
onMount(() => {
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });
});
```

### 2. Event listener type inconsistency (PatchworkFrame.tsx:318-325)
```typescript
element.addEventListener(
  "patchwork:open-document",
  onOpenDocument as EventListener  // Type cast on add
);

onCleanup(() => {
  (element as HTMLElement).removeEventListener(
    "patchwork:open-document",
    onOpenDocument  // No cast on remove - inconsistent
  );
});
```

**Problem:** Inconsistent type handling between add and remove. The type cast should be consistent, or better, the types should be properly defined.

### 3. Custom type definitions in component file (PatchworkFrame.tsx:43-54)
```typescript
declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": { ... };
    }
  }
}
```

**Problem:** Module augmentation should be in a separate `.d.ts` file, not in a component file. This can cause issues with type resolution and is not idiomatic.

**Fix:** Move to `src/types.ts` or a dedicated `patchwork-view.d.ts` file.

---

## ⚠️ Non-Idiomatic Patterns

### 1. Multiple effects for localStorage persistence (PatchworkFrame.tsx:99-125)
```typescript
createEffect(() => {
  localStorage.setItem("patchwork:leftSidebarCollapsed", String(isSidebarCollapsed()));
});

createEffect(() => {
  localStorage.setItem("patchwork:rightSidebarCollapsed", String(isRightSidebarCollapsed()));
});

createEffect(() => {
  localStorage.setItem("patchwork:leftSidebarWidth", String(leftSidebarWidth()));
});

createEffect(() => {
  localStorage.setItem("patchwork:rightSidebarWidth", String(rightSidebarWidth()));
});
```

**Problem:** Four separate effects for related localStorage operations is verbose and creates unnecessary reactive overhead.

**Comparison:** Sideboard doesn't show this pattern because it doesn't have localStorage persistence, but the idiomatic approach would be to combine related effects.

**Fix:** Combine into a single effect:
```typescript
createEffect(() => {
  localStorage.setItem("patchwork:leftSidebarCollapsed", String(isSidebarCollapsed()));
  localStorage.setItem("patchwork:rightSidebarCollapsed", String(isRightSidebarCollapsed()));
  localStorage.setItem("patchwork:leftSidebarWidth", String(leftSidebarWidth()));
  localStorage.setItem("patchwork:rightSidebarWidth", String(rightSidebarWidth()));
});
```

### 2. Not using makeDocumentProjection (PatchworkFrame.tsx:63-65)
```typescript
const [accountDoc, accountDocHandle] = useDocument<TinyPatchworkConfigDoc>(
  () => accountDocUrl
);
```

**Comparison:** Sideboard uses `makeDocumentProjection` (sideboard.tsx:27):
```typescript
const doc = makeDocumentProjection(props.handle);
const [folder, folderHandle] = useDocument<FolderDoc>(() => doc.rootFolderUrl, props);
```

**Problem:** `makeDocumentProjection` provides a cleaner API for accessing document properties directly without needing to call the signal repeatedly.

**Fix:** Use makeDocumentProjection for the account document.

### 3. Using RepoContext.Provider (index.tsx:19-21)
```typescript
<RepoContext.Provider value={element.repo}>
  <PatchworkFrame docUrl={handle.url} element={element} />
</RepoContext.Provider>
```

**Comparison:** Sideboard doesn't use RepoContext.Provider and just passes repo through props (sideboard.tsx:26-35).

**Problem:** While not incorrect, this adds unnecessary context provider overhead when the repo can simply be passed as a prop.

**Fix:** Remove the provider and pass repo as a prop to PatchworkFrame.

### 4. Manual subscription instead of useSubscribe (PatchworkFrame.tsx:215-222)
```typescript
const subscribable = globalAnnotations.onRef(docRef);

const unsubscribe = subscribable.subscribe((value) => {
  setSelectedDocAnnotations(value);
});

onCleanup(unsubscribe);
```

**Comparison:** Sideboard uses useSubscribe (sideboard.tsx:36):
```typescript
const selectedDocUrls = useSubscribe($selectedDocUrls);
```

**Problem:** Manually implementing subscription logic that's already provided by useSubscribe.

**Fix:** Use useSubscribe if the subscribable API is compatible:
```typescript
const selectedDocAnnotations = useSubscribe(() =>
  selectedDocRef() ? globalAnnotations.onRef(selectedDocRef()!) : undefined
);
```

### 5. AnnotationSet created outside effects (PatchworkFrame.tsx:256)
```typescript
const annotations = new AnnotationSet();

createEffect(() => {
  const docRef = selectedDocRef();
  if (!docRef) return;

  globalAnnotations.add(annotations);
  onCleanup(() => {
    globalAnnotations.remove(annotations);
  });
});
```

**Problem:** Creating the AnnotationSet at component level means it persists across all effect re-runs. This might be intentional, but it's not clear. The lifecycle is split between component creation and effect management.

**Recommendation:** Add a comment explaining why this is created outside the effect, or move it inside if appropriate.

### 6. Custom useDocuments hook reimplements primitives (effects.ts:24-69)
```typescript
function useDocuments<T>(urlsAccessor: Accessor<AutomergeUrl[]>) {
  const repo = useRepo();
  const [docsMap, setDocsMap] = createSignal<Map<AutomergeUrl, T>>(new Map());

  createEffect(() => {
    const urls = urlsAccessor();
    const handlers = new Map();

    urls.forEach((url) => {
      repo.find<T>(url).then((handle) => {
        // Manual subscription handling...
      });
    });
    // ...
  });
}
```

**Problem:** This custom hook manually implements document loading and subscription logic that could potentially be simplified using the automerge-repo-solid-primitives library's features.

**Comparison:** Sideboard uses the built-in primitives directly without custom wrappers.

**Recommendation:** Consider if this can be simplified or if it's necessary complexity for the multi-document use case. If kept, add comprehensive JSDoc documentation explaining why this custom implementation is needed.

### 7. Separate effects for related annotations logic (PatchworkFrame.tsx:258-295)
Two separate effects (lines 258-269 and 271-295) both deal with annotations on the selected document but are split apart.

**Problem:** Related logic is fragmented, making it harder to understand the complete annotations lifecycle.

**Recommendation:** Consider combining if they can be safely merged, or add comments explaining why they must be separate.

---

## 💡 Opportunities for Improvement

### 1. Type safety issues
- **PatchworkFrame.tsx:203** - Uses `any` for selectedDocAnnotations type. Should use proper type.
- **effects.ts:32** - Uses `any` for handle type in useDocuments.

**Fix:** Use proper types from the annotations and automerge-repo packages.

### 2. Debug logging (PatchworkFrame.tsx:66, 309, 389)
```typescript
console.log("Rendering grjte's frame tool with account doc: ", accountDocUrl);
console.log("Received open document event: ", event.detail);
console.log("Mounting patchwork-view with key:", key);
```

**Problem:** Debug logs left in production code.

**Fix:** Either remove or wrap in a debug flag:
```typescript
const DEBUG = import.meta.env.DEV;
if (DEBUG) console.log(...);
```

### 3. Commented-out code (PatchworkFrame.tsx:303-304)
```typescript
//todo disabling this until it supports folders
// useAddUnknownDocumentsToSidebarEffect(rootFolderUrl);
```

**Problem:** Commented code should either be implemented or removed.

**Fix:** Create a proper TODO tracking system or remove if not needed.

### 4. Inline IIFE for initial state (PatchworkFrame.tsx:81-92)
```typescript
const [leftSidebarWidth, setLeftSidebarWidth] = createSignal(
  (() => {
    const stored = localStorage.getItem("patchwork:leftSidebarWidth");
    return stored ? parseInt(stored, 10) : 400;
  })()
);
```

**Problem:** This pattern works but is verbose for simple initialization.

**Fix:** Extract to helper function:
```typescript
function getStoredWidth(key: string, defaultValue: number): number {
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : defaultValue;
}

const [leftSidebarWidth, setLeftSidebarWidth] = createSignal(
  getStoredWidth("patchwork:leftSidebarWidth", 400)
);
```

### 5. Magic numbers (PatchworkFrame.tsx:154, 159)
```typescript
const newWidth = Math.max(200, Math.min(600, e.clientX));
```

**Problem:** Magic numbers without explanation.

**Fix:** Extract to constants:
```typescript
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX));
```

### 6. Unnecessary type casting (PatchworkFrame.tsx:254)
```typescript
() => selectedDocHandle() as DocHandle<DocWithComments> | undefined
```

**Problem:** Type casting might indicate a type definition issue upstream.

**Recommendation:** Investigate if the types can be properly inferred without casting.

### 7. Complex drag threshold logic (PatchworkFrame.tsx:146-151)
```typescript
const deltaX = Math.abs(e.clientX - dragStartPos.x);
const deltaY = Math.abs(e.clientY - dragStartPos.y);
if (deltaX > 3 || deltaY > 3) {
  hasDragged = true;
}
```

**Fix:** Extract to helper:
```typescript
const DRAG_THRESHOLD = 3;

function exceedsDragThreshold(start: { x: number; y: number }, current: { x: number; y: number }): boolean {
  return Math.abs(current.x - start.x) > DRAG_THRESHOLD ||
         Math.abs(current.y - start.y) > DRAG_THRESHOLD;
}
```

### 8. Global window mutation (PatchworkFrame.tsx:330-332)
```typescript
createEffect(() => {
  (window as any).currentDocHandle = selectedDocRef()?.docHandle;
});
```

**Problem:** Mutating global window object without clear documentation about why this is needed.

**Recommendation:** Add a comment explaining why this is necessary, or remove if it's debug code.

### 9. Duplicate ternary in style/class (PatchworkFrame.tsx:342-343)
```typescript
class={`flex relative ${isSidebarCollapsed() ? "w-0" : ""}`}
style={{ width: `${isSidebarCollapsed() ? 0 : leftSidebarWidth()}px` }}
```

**Problem:** Same condition checked twice.

**Fix:** Use a memo or single conditional rendering.

### 10. useDebugRegistryToast comment quality (useDebugRegistryToast.tsx:7-13)
```typescript
// NOTE: THIS IS GARBAGE CODE AND WILL BE REMOVED
// Written by Claude
// I hope its awfullness will be a good motivator
```

**Problem:** While honest, this doesn't provide actionable information.

**Recommendation:** Replace with actual TODO explaining what needs to be done to remove this code properly.

### 11. Lack of error handling
Throughout the codebase, there's minimal error handling for:
- localStorage operations (could fail in private browsing)
- async operations (repo.find, commentThreadsWithRefOfDoc)
- Document mutations

**Recommendation:** Add try-catch blocks for localStorage operations and consider error boundaries for component errors.

### 12. No JSDoc documentation
None of the exported functions or components have JSDoc documentation.

**Recommendation:** Add JSDoc to:
- PatchworkFrame component (props explanation)
- useCommentThreadsWithRefOfDoc hook
- useUpdateDocLinksOfActiveDocumentsEffect
- useAddUnknownDocumentsToSidebarEffect

---

## Comparison with Sideboard Best Practices

### What Sideboard Does Better

1. **Cleaner Props Pattern** - Uses typed PatchworkToolProps interface
2. **makeDocumentProjection** - Cleaner document property access
3. **Simple State Management** - Module-level signals for global state
4. **Helper Functions** - Creates clean helpers like `createOpenEvent`
5. **No Context Provider Overhead** - Passes dependencies through props

### What Patchwork-Frame Does Better

1. **localStorage Persistence** - Implements persisted UI state (though could be cleaner)
2. **Drag Threshold Logic** - Prevents accidental toggles during resizing
3. **Keyed Rendering** - Proper use of keyed Show for view remounting

---

## Priority Recommendations

### High Priority (Correctness)
1. Fix event listener setup to use `onMount` instead of `createEffect`
2. Move JSX type declarations to separate `.d.ts` file
3. Fix type inconsistencies in event listener add/remove

### Medium Priority (Code Quality)
1. Combine localStorage effects into single effect
2. Use `makeDocumentProjection` for cleaner document access
3. Replace manual subscription with `useSubscribe` where applicable
4. Add proper types, remove `any` usage
5. Remove or properly flag debug console.log statements

### Low Priority (Maintainability)
1. Extract magic numbers to constants
2. Add JSDoc documentation
3. Add error handling for localStorage and async operations
4. Simplify or document custom useDocuments hook
5. Clean up commented code and TODOs

---

## Conclusion

The patchwork-frame implementation is functional and demonstrates good understanding of SolidJS, but would benefit from:

1. Following the patterns established in sideboard more closely
2. Reducing the number of effects by combining related operations
3. Improving type safety throughout
4. Better documentation and error handling

The most critical issue is the event listener setup pattern. The most impactful improvements would be consolidating effects and adopting `makeDocumentProjection` for cleaner code.
