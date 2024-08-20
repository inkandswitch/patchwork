import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  parseAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import { atom, computed, react, Signal } from "signia";
import { Om } from "./om";
import { useValue } from "signia-react";
import { useDebugValue, useMemo } from "react";

/**************************************/
/* Background: Three layers of values */
/**************************************/

/*
  Three possible types we can use to represent values reacting to documents:

    1. T (and throw if loading / missing) [use in reactive context]
              ↓            ↑
            catch        throw
              ↓            ↑
    2. T | LoadingError | MissingError [use in reactive context]
              ↓            ↑
           computed      .value
              ↓            ↑
    3. Signal<T | LoadingError | MissingError>

  At the interface to React, we can take any of these (since the hook can
  convert as needed). When writing code, option #1 is most convenient. So I
  guess we should use option #1 in our reactive infrastructure.

  Call #1 a "doc-reactive value".
  Call #2 a "doc-reactive state".
  Call #3 a "doc-reactive signal".
*/

/*********************************/
/* App-facing API: Generic stuff */
/*********************************/

export type DocReactiveState<T> = T | DocLoading | DocMissingError;
export type DocReactiveSignal<T> = Signal<DocReactiveState<T>>;

// TODO: This isn't really an "error"; it's a normal state. Could rename?
export class DocLoading extends Error {
  isLoadingError = true; // here for weird typing reasons

  constructor(readonly url?: AutomergeUrl) {
    super(`Document is loading: ${url ?? "unknown"}`);
  }
}

// This is a real error tho!
export class DocMissingError extends Error {
  isMissingError = true; // here for weird typing reasons

  constructor(readonly url?: AutomergeUrl) {
    super(`Document is missing: ${url ?? "unknown"}`);
  }
}

/**
 * React hook. Given a doc-reactive value callback, returns a doc-reactive state
 * that updates when upstream doc states change.
 */

export function useDocReactive<T>(cb: () => T): DocReactiveState<T>;
export function useDocReactive<T>(
  label: string,
  cb: () => T
): DocReactiveState<T>;
export function useDocReactive<T>(
  labelOrCb: string | (() => T),
  maybeCb?: () => T
): DocReactiveState<T> {
  const cb = typeof labelOrCb === "function" ? labelOrCb : (maybeCb as () => T);
  const label = typeof labelOrCb === "string" ? labelOrCb : undefined;

  const signal = useMemo(
    () => computed("useDocReactive", () => docReactiveValueToState(cb)),
    [cb]
  );

  const value = useValue(signal);
  useDebugValue(label ? { [label]: value } : value);
  return value;
}

/**
 * Turn a reactive doc into a signal
 * This is useful when using reactive docs outside of react
 */
export function docReactiveSignal<T>(cb: () => T): DocReactiveSignal<T> {
  return computed("docReactiveSignal", () => docReactiveValueToState(cb));
}

/**
 * For use in async code. Waits for a doc-reactive value callback to be loaded,
 * then resolves with the value. Throws if the value is missing.
 */
export function waitForLoaded<T>(cb: () => T): Promise<T> {
  const signal = computed("loadedValue", () => docReactiveValueToState(cb));
  return new Promise((resolve) => {
    // `react` runs synchronously, but it can't unsubscribe during this first
    // run since `unsubscribe` itself isn't defined yet; hence the `firstRun` /
    // `workedOnFirstRun` dance.
    let firstRun = true;
    let workedOnFirstRun = false;
    const unsubscribe = react(`wait for ${signal.name} to be defined`, () => {
      if (signal.value instanceof DocLoading) {
        // still loading, keep waiting
        return;
      } else if (signal.value instanceof DocMissingError) {
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

/**
 * Panics if a doc-reactive state is missing, cuz that's a pretty exceptional ase.
 */
export function throwIfMissing<T>(
  value: DocReactiveState<T>
): asserts value is T | DocLoading {
  if (value instanceof DocMissingError) {
    throw value;
  }
}

/**
 * Check if a doc-reactive state is loaded. This is useful for type narrowing.
 */
export function isLoaded<T>(value: DocReactiveState<T>): value is T {
  return !(value instanceof DocLoading || value instanceof DocMissingError);
}

/**
 * Turn error states into `undefined`, for integration with legacy code.
 */
export function ifLoaded<T>(value: DocReactiveState<T>): T | undefined {
  if (value instanceof DocLoading || value instanceof DocMissingError) {
    return undefined;
  }
  return value;
}

/**
 * Used in a reactive context to give a doc-reactive state a chance to throw a
 * LoadingError / MissingError. This is useful for type narrowing.
 */
export function waitForDR<T>(value: DocReactiveState<T>): asserts value is T {
  if (value instanceof DocLoading || value instanceof DocMissingError) {
    throw value;
  }
}

/**
 * Turn a doc-reactive state into a value, possibly by throwing a LoadingError /
 * MissingError. Can be used to thread output of one useDocReactive into
 * another. Could perhaps use a better name.
 */
export function getDR<T>(value: DocReactiveState<T>): T {
  waitForDR(value);
  return value;
}

/**
 * Allows an array of callbacks to be run in parallel. If any of them throws a
 * LoadingError, `parallel` will throw a LoadingError, but not until giving the
 * other callbacks a chance to run so they can make progress. This is analogous
 * to Promise.all in async code.
 */
export function parallel<T>(cbs: (() => T)[]): T[] {
  let loadingError: DocLoading | undefined = undefined;
  const results: T[] = [];
  for (const cb of cbs) {
    try {
      results.push(cb());
    } catch (e) {
      if (e instanceof DocLoading) {
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

/**
 * Maps a function across an array in parallel. If any of the executions throws
 * a LoadingError, `parallel` will throw a LoadingError, but not until giving
 * the other executions a chance to run so they can make progress. This is
 * analogous to a use of `Promise.all` with `.map` in async code.
 */
export function parallelMap<T, U>(values: T[], fn: (value: T) => U): U[] {
  return parallel(values.map((value) => () => fn(value)));
}

// Given a promise and a timeout, returns a promise which
// rejects if the promise doesn't resolve within the timeout
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

/**********************************/
/* Reactive values for docs & oms */
/**********************************/

// TODO: all doc functions accept a third optional heads argument which is a bit akward
// instead we should put heads into the url

const DOC_SIGNAL_CACHE = new Map<
  string,
  Signal<DocReactiveState<Doc<unknown>>>
>();

const DOC_LOADING_TIMEOUT = 3000;

function getDocSignal<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Signal<DocReactiveState<Doc<T>>> {
  if (!(typeof url === "string")) {
    throw new Error(`Expected string URL, got ${url}`);
  }

  const KEY = `${url}:${heads?.join(",")}`;

  const fromCache = DOC_SIGNAL_CACHE.get(KEY);
  if (fromCache) {
    return fromCache as Signal<DocReactiveState<Doc<T>>>;
  }

  const signal = atom<DocReactiveState<Doc<T>>>(
    `getDocSig:${url}`,
    new DocLoading(url)
  );

  const handle = repo.find<T>(url);

  // TODO: should we allow configuring this timeout behavior?
  timeoutPromise(handle.doc(), DOC_LOADING_TIMEOUT)
    .then((doc) => {
      signal.set(
        doc
          ? heads
            ? Automerge.view(doc, heads)
            : doc
          : new DocMissingError(url)
      );
    })
    .catch(() => {
      signal.set(new DocMissingError(url));
    });

  // don't subscribe to changes if we view the doc at some heads
  if (!heads) {
    handle.on("change", (ev) => {
      signal.set(ev.doc);
    });
    handle.on("delete", () => {
      signal.set(new DocMissingError(url));
    });
  }

  DOC_SIGNAL_CACHE.set(KEY, signal);
  return signal;
}

/**
 * Get the state of a doc in a reactive context. If the doc is loading or
 * missing, this will be reflected in the return value – this function will not
 * throw.
 */
export function getDocState<T = Doc<unknown>>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): DocReactiveState<Doc<T>> {
  return getDocSignal<T>(url, repo, heads).value;
}

/**
 * Get the value of a doc in a reactive context. If the doc is loading or
 * missing, this will throw an error which will be caught by useDocReactive.
 */
export function getDoc<T = Doc<unknown>>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Doc<T> {
  return getDR(getDocSignal<T>(url, repo, heads).value);
}

const OM_SIGNAL_CACHE = new Map<
  string,
  Signal<DocReactiveState<Om<unknown>>>
>();

function getOmSignal<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Signal<DocReactiveState<Om<T>>> {
  const KEY = `${url}:${heads?.join(",")}`;

  const fromCache = OM_SIGNAL_CACHE.get(KEY);
  if (fromCache) {
    return fromCache as Signal<DocReactiveState<Om<T>>>;
  }

  const docSignal = getDocSignal<T>(url, repo);
  const id = parseAutomergeUrl(url).documentId;
  const handle = repo.find<T>(id);
  const omSignal = computed(`getOmSig:${url}`, () =>
    mapDocReactive(docSignal.value, (doc) => ({ url, id, handle, doc }))
  );

  OM_SIGNAL_CACHE.set(KEY, omSignal);
  return omSignal;
}

/**
 * Get the state of an Om in a reactive context. If the doc is loading or
 * missing, this will be reflected in the return value – this function will not
 * throw.
 */
export function getOmState<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): DocReactiveState<Om<T>> {
  return getOmSignal<T>(url, repo, heads).value;
}

/**
 * Get the value of an Om in a reactive context. If the doc is loading or
 * missing, this will throw an error which will be caught by useDocReactive.
 */
export function getOm<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Om<T> {
  return getDR(getOmSignal<T>(url, repo, heads).value);
}

/**********************/
/* Internal utilities */
/**********************/

function mapDocReactive<T, U>(
  value: DocReactiveState<T>,
  fn: (value: T) => U
): DocReactiveState<U> {
  if (value instanceof DocLoading || value instanceof DocMissingError) {
    return value;
  }
  return fn(value);
}

/**
 * Turn a doc-reactive value callback into a state, possibly by catching a
 * LoadingError / MissingError.
 */
function docReactiveValueToState<T>(cb: () => T): DocReactiveState<T> {
  try {
    return cb();
  } catch (e) {
    if (e instanceof DocLoading || e instanceof DocMissingError) {
      return e;
    }
    throw e;
  }
}
