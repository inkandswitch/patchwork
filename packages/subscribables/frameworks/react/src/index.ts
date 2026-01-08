import {
  valueOfSubscribable,
  type Subscribable,
} from "@inkandswitch/subscribables";
import { useCallback, useSyncExternalStore } from "react";

export function useSubscribe<T>(subscribable: Subscribable<T>): T;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!subscribable) {
        return () => {};
      }
      return subscribable.subscribe(() => {
        onStoreChange();
      });
    },
    [subscribable]
  );

  const getSnapshot = useCallback(
    () => (subscribable ? valueOfSubscribable(subscribable) : undefined),
    [subscribable]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
