import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  DocHandle,
  parseAutomergeUrl,
  Repo,
} from "@automerge/automerge-repo";
import { atom } from "signia";
import { Om } from "../om";
import { asyncComputed, AsyncSignal, AsyncState } from "./core";

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

const HANDLE_SIGNAL_CACHE = new Map<string, AsyncSignal<DocHandle<unknown>>>();

function getDocHandleSignal<T>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): AsyncSignal<DocHandle<T>> {
  if (!(typeof url === "string")) {
    throw new Error(`Expected string URL, got ${url}`);
  }

  const KEY = url + (heads ? `@${heads.join(",")}` : "");

  const fromCache = HANDLE_SIGNAL_CACHE.get(KEY);
  if (fromCache) {
    return fromCache as AsyncSignal<DocHandle<T>>;
  }

  const signal = atom<AsyncState<DocHandle<T>>>(
    `getDocSig:${url}`,
    new AsyncState.Pending(`Loading document: ${KEY}`)
  );

  // Constructing the error here gives better stack traces
  const missingError = new DocHandleMissingError(KEY as AutomergeUrl);

  repo
    .find<T>(url)
    .then((handle) => {
      signal.set(new AsyncState.Fulfilled(handle));

      // Subscribe to changes if heads are not provided
      if (!heads) {
        handle.on("change", (ev) => {
          signal.set(new AsyncState.Fulfilled(ev.handle));
        });
        handle.on("delete", () => {
          signal.set(new AsyncState.Rejected(missingError));
        });
      }
    })
    .catch(() => {
      signal.set(new AsyncState.Rejected(missingError));
    });

  HANDLE_SIGNAL_CACHE.set(KEY, signal);
  return signal;
}

/**
 * Get the state of a doc in a reactive context. If the doc is loading or
 * missing, this will be reflected in the return value – this function will not
 * throw.
 */
export function getDocHandleState<T = unknown>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): AsyncState<DocHandle<T>> {
  return getDocHandleSignal<T>(url, repo, heads).value;
}

/**
 * Get the value of a doc in a reactive context. If the doc is loading or
 * missing, this will throw an error.
 */
export function fetchDocHandle<T = unknown>(
  url: AutomergeUrl,
  repo: Repo,
  heads?: Automerge.Heads
): DocHandle<T> {
  return getDocHandleState<T>(url, repo, heads).fetch();
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

  const handleSignal = getDocHandleSignal<T>(url, repo, heads);
  const id = parseAutomergeUrl(url).documentId;

  const omSignal = asyncComputed(() => {
    return {
      url,
      id,
      handle: handleSignal.value.fetch(),
      doc: handleSignal.value.fetch().doc(),
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
