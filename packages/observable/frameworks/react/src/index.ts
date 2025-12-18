import {
  unwrapObservable,
  computed,
  type Observable,
} from "@inkandswitch/observable";
import { useCallback, useMemo, useSyncExternalStore } from "react";

export function useObservable<T>(observable: Observable<T>): T;
export function useObservable<T>(observable?: Observable<T>): T | undefined;
export function useObservable<T>(observable?: Observable<T>): T | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!observable) {
        return () => {};
      }
      return observable.subscribe(() => {
        onStoreChange();
      });
    },
    [observable]
  );

  const getSnapshot = useCallback(
    () => (observable ? unwrapObservable(observable) : undefined),
    [observable]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
