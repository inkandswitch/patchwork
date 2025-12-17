import type { Observable } from "@patchwork/observable";
import { useCallback, useSyncExternalStore } from "react";

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
    () => observable?.value,
    [observable]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
