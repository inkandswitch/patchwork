import { AutomergeUrl, Doc, parseAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { atom, computed, react, Signal } from 'signia';
import { Om } from "./om";
import { useValue } from "signia-react";
import { useMemo } from "react";

// Three possible types we can use to represent values reacting to documents:

//   1. T (and throw if loading / missing) [use in reactive context]
//             ↓            ↑
//           catch        throw
//             ↓            ↑
//   2. T | LoadingError | MissingError [use in reactive context]
//             ↓            ↑
//          computed      .value
//             ↓            ↑
//   3. Signal<T | LoadingError | MissingError>

// At the interface to React, we can take any of these (since the hook can
// convert as needed). When writing code, option #1 is most convenient. So I
// guess we should use option #1 in our reactive infrastructure.

export class LoadingError extends Error {
  isLoadingError = true;  // here for weird typing reasons

  constructor(readonly url: AutomergeUrl) {
    super(`Document is loading: ${url}`);
  }
}

export class MissingError extends Error {
  isMissingError = true;  // here for weird typing reasons

  constructor(readonly url: AutomergeUrl) {
    super(`Document is missing: ${url}`);
  }
}

function mapUsesDocs<T, U>(value: UsesDocs<T>, fn: (value: T) => U): UsesDocs<U> {
  if (value instanceof LoadingError || value instanceof MissingError) {
    return value;
  }
  return fn(value);
}

export type UsesDocs<T> = T | LoadingError | MissingError;

export function catchUsesDocs<T>(cb: () => T): UsesDocs<T> {
  try {
    return cb();
  } catch (e) {
    if (e instanceof LoadingError || e instanceof MissingError) {
      return e;
    }
    throw e;
  }
}

export function throwIfMissing<T>(value: UsesDocs<T>): asserts value is (T | LoadingError) {
  if (value instanceof MissingError) {
    throw value;
  }
}

// TODO: hopefully won't need this one except internally?
function getUsesDocs<T>(sig: Signal<UsesDocs<T>>): T {
  const value = sig.value;
  if (value instanceof LoadingError || value instanceof MissingError) {
    throw value;
  }
  return value;
}

export function useUsesDocs<T>(cb: () => T): UsesDocs<T> {
  const signal = useMemo(() => computed("useUsesDocs", () => catchUsesDocs(cb)), [cb]);
  return useValue(signal);
}

export function loadedValue<T>(cb: () => T): Promise<T> {
  // make a signal that catches errors & records reactive dependencies
  const signal = computed("loadedValue", () => catchUsesDocs(cb));
  return new Promise((resolve) => {
    // `react` runs synchronously, but it can't unsubscribe during this first
    // run since `unsubscribe` itself isn't defined yet; hence the `firstRun` /
    // `workedOnFirstRun` dance.
    let firstRun = true;
    let workedOnFirstRun = false;
    const unsubscribe = react(`wait for ${signal.name} to be defined`, () => {
      if (signal.value instanceof LoadingError) {
        // still loading, keep waiting
        return;
      } else if (signal.value instanceof MissingError) {
        // missing, throw an error
        throw signal.value;
      } else {
        // loaded, resolve the promise
        if (!firstRun) {
          unsubscribe();
        } else {
          workedOnFirstRun = true;
        }
        resolve(signal.value);
      }
    });
    if (workedOnFirstRun) {
      unsubscribe();
    }
    firstRun = false;
  });
}

export function parallel<T>(cbs: (() => T)[]): T[] {
  // "Here, `parallel` takes an array of functions. It calls all the functions,
  // each inside try/catch. If any one fails with LOADING, it records that it
  // should itself throw with LOADING. But it keeps calling the rest of the
  // functions anyway, to record further registrations. So it kinda does the job
  // of Promise.all."

  let loadingError: LoadingError | undefined = undefined;
  const results: T[] = [];
  for (const cb of cbs) {
    try {
      results.push(cb());
    } catch (e) {
      if (e instanceof LoadingError) {
        loadingError = e;
      } else {
        throw e;
      }
    }
  }
  if (loadingError) {
    throw loadingError;
  }
  return results;
}

export function parallelMap<T, U>(values: T[], fn: (value: T) => U): U[] {
  return parallel(values.map((value) => () => fn(value)));
}

export function isLoaded<T>(value: UsesDocs<T>): value is T {
  return !(value instanceof LoadingError || value instanceof MissingError);
}

/**********************************/
/* Reactive values for docs & oms */
/**********************************/

const DOC_SIGNAL_CACHE = new Map<AutomergeUrl, Signal<any>>();

function getDocSignal<T>(url: AutomergeUrl, repo: Repo): Signal<UsesDocs<T>> {
  const fromCache = DOC_SIGNAL_CACHE.get(url);
  if (fromCache) {
    return fromCache;
  }

  const signal = atom<UsesDocs<T>>(`getDocSig:${url}`, new LoadingError(url))

  const handle = repo.find<T>(url);
  handle.doc().then((doc) => {
    signal.set(doc ?? new MissingError(url));
  })
  handle.on("change", (ev) => {
    signal.set(ev.doc);
  })
  handle.on("delete", () => {
    signal.set(new MissingError(url));
  });

  DOC_SIGNAL_CACHE.set(url, signal);
  return signal;
}

export function getDocSync<T = Doc<unknown>>(url: AutomergeUrl, repo: Repo): UsesDocs<T> {
  return getDocSignal<T>(url, repo).value;
}

export function getDoc<T = Doc<unknown>>(url: AutomergeUrl, repo: Repo): T {
  return getUsesDocs(getDocSignal<T>(url, repo));
}

export function getOmSignal<T>(url: AutomergeUrl, repo: Repo): Signal<UsesDocs<Om<T>>> {
  const docSignal = getDocSignal<T>(url, repo);
  const id = parseAutomergeUrl(url).documentId;
  const handle = repo.find<T>(id);
  return computed(`getOmSig:${url}`, () =>
    mapUsesDocs(docSignal.value, (doc) => ({ url, id, handle, doc }))
  );
}

export function getOmSync<T>(url: AutomergeUrl, repo: Repo): UsesDocs<Om<T>> {
  return getOmSignal<T>(url, repo).value;
}

export function getOm<T>(url: AutomergeUrl, repo: Repo): Om<T> {
  return getUsesDocs(getOmSignal<T>(url, repo));
}
