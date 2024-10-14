import { isEqual, isObject } from "lodash";

// Utilities for bridging the worlds of Engraft and Automerge

// Background: Engraft programs are represented as immutable
// JavaScript values, using the "structural sharing" pattern to
// represent changes. That means programs in Engraft are updated with
// code like:
//
// ```
// updateProgram((oldProgram) => ({
//   ...oldProgram,
//   myArrayField: [
//     ...oldProgram.myArrayField,
//     'pushed value',
//   ],
// }));
// ```
//
// There are helpers to make this less awkward, but the semantics are
// the same: subtrees of the nested program tree that aren't touched
// remain the same (reference-equality-wise), but touched parts and
// their ancestors are created anew.
//
// So when an Engraft component reports a change to its host, it
// really just gives it a new version of the program. But Automerge
// wants to perform changes to documents in an imperative style,
// recording individual changes to proxy objects.
//
// In the long run, Engraft should maybe switch to an imperative
// style itself, cuz it's more general. But for now we'll use a cheap
// and cheerful bridge.

/** Change a part of an Automerge doc (represented by `proxy`) to
 * match the structural-sharing transformation from `oldVal` to
 * `newVal`. A function `topLevelSetter` must be provided to handle
 * the case where the top-level part of the Automerge doc must be
 * replaced entirely. */
export function applyUpdateAsChangeWithTopLevelSetter<T>(
  oldVal: T,
  newVal: T,
  proxy: T,
  topLevelSetter: (newVal: T) => void
): void {
  if (oldVal === newVal) {
    return;
  } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    applyUpdateAsChangeToArray(oldVal, newVal, proxy as unknown[]);
  } else if (isObject(oldVal) && isObject(newVal)) {
    applyUpdateAsChangeToObject(oldVal, newVal, proxy as object);
  } else {
    // TODO: handle strings with updateText?
    topLevelSetter(newVal);
  }
}

/** Change an object-valued part of an Automerge doc (represented by
 * `proxy`) to match the structural-sharing transformation from
 * `oldVal` to `newVal`. */
export function applyUpdateAsChangeToObject<T extends object>(
  oldVal: T,
  newVal: T,
  proxy: T
): void {
  if (oldVal === newVal) {
    return;
  }
  for (const key in newVal) {
    if (oldVal[key] !== newVal[key]) {
      applyUpdateAsChangeWithTopLevelSetter(
        oldVal[key],
        newVal[key],
        proxy[key],
        (newVal) => {
          proxy[key] = newVal;
        }
      );
    }
  }
  for (const key in oldVal) {
    if (!(key in newVal)) {
      delete oldVal[key];
    }
  }
}

/** Change an array-valued part of an Automerge doc (represented by
 * `proxy`) to match the structural-sharing transformation from
 * `oldVal` to `newVal`. */
export function applyUpdateAsChangeToArray<T>(
  oldVal: readonly T[],
  newVal: readonly T[],
  proxy: T[]
): void {
  if (oldVal === newVal) {
    return;
  }
  // We need to diff oldVal & newVal, to identify:
  //
  // 1. Insertion of new elements
  // 2. Deletion of old elements
  // 3. Modification of existing elements
  //
  // For now, we phone it in hilariously. Just look at length, and
  // infer one (and only one) of 1/2/3 from that. If we get
  // granular-enough changes from Engraft components, this might work
  // out ok.

  function bailOut() {
    // We call this function if the diff is too complicated and we
    // get lost. It will make bad changes.
    console.warn("Bailing out of array diff!", oldVal, newVal);
    proxy.splice(0, oldVal.length, ...newVal);
  }

  if (oldVal.length < newVal.length) {
    // Case 1: Detect if old array is a subset of the new array
    let additionIndices: number[] = [];
    let iOld = 0;
    let iNew = 0;
    while (iOld < oldVal.length && iNew < newVal.length) {
      if (oldVal[iOld] === newVal[iNew]) {
        iOld++;
        iNew++;
      } else {
        // mismatch; assume it's an addition
        additionIndices.push(iNew);
        iNew++;
      }
    }
    // have we exhausted the old array?
    if (iOld === oldVal.length) {
      // the rest of the new array is additions
      while (iNew < newVal.length) {
        additionIndices.push(iNew);
        iNew++;
      }
      // now we make the additions to the old array
      for (const i of additionIndices) {
        proxy.splice(i, 0, newVal[i]);
      }
    } else {
      console.warn(
        `Tried to determine additions, but only accounted for ${iOld} of ${oldVal.length} old elements`
      );
      bailOut();
    }
  } else if (oldVal.length > newVal.length) {
    // Case 2: Detect if new array is a subset of the old array
    let removalIndices: number[] = [];
    let iOld = 0,
      iNew = 0;
    while (iOld < oldVal.length && iNew < newVal.length) {
      if (oldVal[iOld] === newVal[iNew]) {
        iOld++;
        iNew++;
      } else {
        removalIndices.push(iOld);
        iOld++;
      }
    }
    // have we exhausted the new array?
    if (iNew === newVal.length) {
      // the rest of the old array is removals
      while (iOld < oldVal.length) {
        removalIndices.push(iOld);
        iOld++;
      }
      // now we make the removals from the old array (in reverse order)
      removalIndices.reverse();
      for (const i of removalIndices) {
        proxy.splice(i, 1);
      }
    } else {
      console.warn(
        `Tried to determine removals, but only accounted for ${iNew} of ${newVal.length} new elements`
      );
      bailOut();
    }
  } else {
    // (oldVal.length === newVal.length)
    // Case 3: Assume per-index modifications
    for (let i = 0; i < oldVal.length; i++) {
      applyUpdateAsChangeWithTopLevelSetter(
        oldVal[i],
        newVal[i],
        proxy[i],
        (newVal) => {
          proxy[i] = newVal;
        }
      );
    }
  }
}

// Unrelated to any of the above: Engraft uses `undefined` liberally,
// but Automerge complains when we try to put it into documents. So
// this adapter removes them.

// TODO: Runs in linear time. Do it during the write to save time?
// Take in oldVal to skip unchanged parts? Get Automerge to accept
// undefined?

export function removeUndefineds(val: any): any {
  if (Array.isArray(val)) {
    let newVal: any[] = [];
    let changed = false;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === undefined) {
        newVal[i] = null; // meh
        changed = true;
      } else {
        newVal[i] = removeUndefineds(val[i]);
        if (newVal[i] !== val[i]) {
          changed = true;
        }
      }
    }
    return changed ? newVal : val;
  } else if (isObject(val)) {
    let newVal: any = {};
    let changed = false;
    for (const [key, valAtKey] of Object.entries(val)) {
      if (valAtKey === undefined) {
        // we'll leave it out, which makes a change
        changed = true;
      } else {
        newVal[key] = removeUndefineds(valAtKey);
        if (newVal[key] !== valAtKey) {
          changed = true;
        }
      }
    }
    return changed ? newVal : val;
  } else {
    return val;
  }
}
