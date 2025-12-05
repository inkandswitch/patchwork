import type { Observable } from "@patchwork/observable";
import { useCallback, useRef, useSyncExternalStore } from "react";

export function useObservable<T>(observable?: Observable<T>): T | undefined {
  const valueRef = useRef<T>();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!observable) {
        return () => {};
      }
      return observable.subscribe((v) => {
        valueRef.current = v;
        onStoreChange();
      });
    },
    [observable]
  );

  const getSnapshot = useCallback(() => valueRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
