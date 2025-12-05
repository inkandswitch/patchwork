import type { Observable } from "@patchwork/observable";
import { useCallback, useRef, useSyncExternalStore } from "react";

export function useObservable<T>(observable: Observable<T>): T {
  const valueRef = useRef<T>();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return observable.subscribe((v) => {
        valueRef.current = v;
        onStoreChange();
      });
    },
    [observable]
  );

  const getSnapshot = useCallback(() => valueRef.current as T, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
