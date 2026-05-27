import { createEffect, createSignal, onCleanup } from "solid-js";
import { findRef, type Ref, type RefUrl, type Repo } from "@automerge/automerge-repo";

// TODO: delete both hooks once subdoc handles land — `RefUrl`s will then
// resolve to `Ref`s synchronously from the parent handle.

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

// Same as useResolvedRefs but grouped by key.
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
