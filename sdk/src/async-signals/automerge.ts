import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  parseAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import { atom } from "signia";
import { Om } from "../om";
import {
  asyncComputed,
  AsyncSignal,
  asyncSignalFromPromise,
  AsyncState,
} from "./core";

export class DocHandleMissingError extends Error {
  isMissingError = true; // here for weird typing reasons

  constructor(readonly url?: AutomergeUrl) {
    super(`Handle is missing: ${url ?? "unknown"}`);
  }
}

/**********************************/
/* Reactive values for docs & oms */
/**********************************/

// TODO: all doc functions accept a third optional heads argument which is a bit akward
// instead we should put heads into the url

const DOC_SIGNAL_CACHE = new Map<string, AsyncSignal<Doc<unknown>>>();

function getDocSignal<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): AsyncSignal<Doc<T>> {
  if (!(typeof url === "string")) {
    throw new Error(`Expected string URL, got ${url}`);
  }

  const KEY = url + (heads ? `@${heads.join(",")}` : "");

  const fromCache = DOC_SIGNAL_CACHE.get(KEY);
  if (fromCache) {
    return fromCache as AsyncSignal<Doc<T>>;
  }

  const signal = atom<AsyncState<Doc<T>>>(
    `getDocSig:${url}`,
    new AsyncState.Pending(`Loading document: ${KEY}`)
  );

  // Constructing the error here gives better stack traces
  const missingError = new DocHandleMissingError(KEY as AutomergeUrl);

  repo
    .find<T>(url)
    .then((handle) => {
      const doc = handle.doc();
      signal.set(
        new AsyncState.Fulfilled(heads ? Automerge.view(doc, heads) : doc)
      );

      // Subscribe to changes if heads are not provided
      if (!heads) {
        handle.on("change", (ev) => {
          signal.set(new AsyncState.Fulfilled(ev.doc));
        });
        handle.on("delete", () => {
          signal.set(new AsyncState.Rejected(missingError));
        });
      }
    })
    .catch(() => {
      signal.set(new AsyncState.Rejected(missingError));
    });

  DOC_SIGNAL_CACHE.set(KEY, signal);
  return signal;
}

/**
 * Get the state of a doc in a reactive context. If the doc is loading or
 * missing, this will be reflected in the return value – this function will not
 * throw.
 */
export function getDocState<T = unknown>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): AsyncState<Doc<T>> {
  return getDocSignal<T>(url, repo, heads).value;
}

/**
 * Get the value of a doc in a reactive context. If the doc is loading or
 * missing, this will throw an error.
 */
export function fetchDoc<T = unknown>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Doc<T> {
  return getDocState<T>(url, repo, heads).fetch();
}

const OM_SIGNAL_CACHE = new Map<string, AsyncSignal<Om<unknown>>>();

function getOmSignal<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): AsyncSignal<Om<T>> {
  const KEY = `${url}:${heads?.join(",")}`;

  const fromCache = OM_SIGNAL_CACHE.get(KEY);
  if (fromCache) {
    return fromCache as AsyncSignal<Om<T>>;
  }

  const docSignal = getDocSignal<T>(url, repo, heads);
  const id = parseAutomergeUrl(url).documentId;

  const handleSignal = asyncSignalFromPromise(repo.find<T>(id));
  const omSignal = asyncComputed(() => {
    return {
      url,
      id,
      handle: handleSignal.value.fetch(),
      doc: docSignal.value.fetch(),
    };
  });

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
): AsyncState<Om<T>> {
  return getOmSignal<T>(url, repo, heads).value;
}

/**
 * Get the value of an Om in a computation. If the doc is loading or missing,
 * this will throw an error which will be caught by useDocReactive.
 */
export function fetchOm<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): Om<T> {
  return getOmState<T>(url, repo, heads).fetch();
}
