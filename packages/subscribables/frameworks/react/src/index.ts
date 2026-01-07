import { valueOfSignal, type Signal } from "@inkandswitch/subscribables";
import { useCallback, useSyncExternalStore } from "react";

export function useSubscribe<T>(signal: Signal<T>): T;
export function useSubscribe<T>(signal?: Signal<T>): T | undefined;
export function useSubscribe<T>(signal?: Signal<T>): T | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!signal) {
        return () => {};
      }
      return signal.subscribe(() => {
        onStoreChange();
      });
    },
    [signal]
  );

  const getSnapshot = useCallback(
    () => (signal ? valueOfSignal(signal) : undefined),
    [signal]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
