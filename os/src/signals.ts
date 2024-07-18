import { AnyDocumentId, AutomergeUrl, parseAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { Signal, atom, computed, react } from 'signia';
import { Om } from "./om";


const DOC_SIGNAL_CACHE = new Map<AutomergeUrl, Signal<any | undefined>>();

const UNDEFINED_SIGNAL = atom('undefined', undefined);

export function DocSig<T>(url: AutomergeUrl | undefined, repo: Repo): Signal<T | undefined> {
  if (!(typeof url === "string")) {
    return UNDEFINED_SIGNAL;
    // throw new Error(`DocSig called with something that isn't a string: ${url}`);
  }

  const fromCache = DOC_SIGNAL_CACHE.get(url);
  if (fromCache) {
    return fromCache as Signal<T | undefined>;
  }

  const signal = atom<T | undefined>(`getDocSig:${url}`, undefined)

  const handle = repo.find<T>(url);
  handle.doc().then((doc) => {
    signal.set(doc);
  })
  handle.on("change", (ev) => {
    signal.set(ev.doc);
  })
  handle.on("delete", () => {
    signal.set(undefined);
  });

  DOC_SIGNAL_CACHE.set(url, signal);
  return signal;
}

export function OmSig<T>(url: AutomergeUrl | undefined, repo: Repo): Signal<Om<T> | undefined> {
  if (!(typeof url === "string")) {
    return UNDEFINED_SIGNAL;
    // throw new Error(`OmSig called with something that isn't a string: ${url}`);
  }
  const docSig = DocSig<T>(url, repo);
  const id = parseAutomergeUrl(url).documentId;
  const handle = repo.find<T>(id);
  return computed(`getOmSig:${url}`, () => docSig.value && { url, id, handle, doc: docSig.value });
}

export function definedValue<T>(signal: Signal<T | undefined>): Promise<T> {
  return new Promise((resolve) => {
    // `react` runs synchronously, but it can't unsubscribe during this first
    // run since `unsubscribe` itself isn't defined yet; hence the `firstRun` /
    // `workedOnFirstRun` dance.
    let firstRun = true;
    let workedOnFirstRun = false;
    const unsubscribe = react(`wait for ${signal.name} to be defined`, () => {
      if (signal.value !== undefined) {
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
