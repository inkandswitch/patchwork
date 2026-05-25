import { createEffect, createSignal, onCleanup } from "solid-js";
import { findRef, type Ref, type RefUrl, type Repo } from "@automerge/automerge-repo";

// NOTE: these helpers are a temporary shim. Once subdoc handles land,
// `RefUrl`s will resolve to `Ref`s synchronously from a parent handle, the
// async `findRef` dance below becomes a single property access, and there
// is no reason for either of these hooks to exist. Delete this file then.

/**
 * Resolve a reactive list of `RefUrl`s into `Ref`s asynchronously, with a
 * shared in-memory cache so the same URL is never `findRef`'d twice for the
 * lifetime of the hook. Failed resolutions are logged and silently dropped
 * from the result.
 *
 * Returns an accessor that initially reads `[]` and updates each time a
 * `findRef` resolves. Caller-supplied `urls` is read inside a reactive
 * scope, so changes to the URL list automatically trigger a refresh.
 */
export function useResolvedRefs(
  urls: () => RefUrl[],
  repo: Repo
): () => Ref[] {
  const cache = new Map<RefUrl, Ref>();
  const [refs, setRefs] = createSignal<Ref[]>([]);
  createEffect(() => {
    const us = urls();
    let cancelled = false;
    if (us.length === 0) {
      setRefs([]);
      return;
    }
    Promise.all(
      us.map(async (u) => {
        const cached = cache.get(u);
        if (cached) return cached;
        try {
          const r = await findRef(repo, u);
          cache.set(u, r);
          return r;
        } catch (error) {
          console.error(`[useResolvedRefs] failed to resolve ${u}`, error);
          return undefined;
        }
      })
    ).then((rs) => {
      if (!cancelled) setRefs(rs.filter((r): r is Ref => !!r));
    });
    onCleanup(() => {
      cancelled = true;
    });
  });
  return refs;
}

/**
 * Same as {@link useResolvedRefs} but preserves grouping: input is a map
 * from arbitrary keys (e.g. parent URLs) to lists of `RefUrl`s, output is
 * a map from those same keys to the resolved `Ref` arrays.
 */
export function useResolvedRefMap<K>(
  urlMap: () => Map<K, RefUrl[]>,
  repo: Repo
): () => Map<K, Ref[]> {
  const cache = new Map<RefUrl, Ref>();
  const [map, setMap] = createSignal<Map<K, Ref[]>>(new Map());
  createEffect(() => {
    const m = urlMap();
    let cancelled = false;
    Promise.all(
      Array.from(m.entries()).map(async ([key, urls]) => {
        const refs = await Promise.all(
          urls.map(async (u) => {
            const cached = cache.get(u);
            if (cached) return cached;
            try {
              const r = await findRef(repo, u);
              cache.set(u, r);
              return r;
            } catch (error) {
              console.error(
                `[useResolvedRefMap] failed to resolve ${u}`,
                error
              );
              return undefined;
            }
          })
        );
        return [key, refs.filter((r): r is Ref => !!r)] as const;
      })
    ).then((entries) => {
      if (!cancelled) setMap(new Map(entries));
    });
    onCleanup(() => {
      cancelled = true;
    });
  });
  return map;
}
