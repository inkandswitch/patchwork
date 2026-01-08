import {
  isSubscribableValue,
  type Subscribable,
  type SubscribableObject,
  type SubscribableValue,
} from "@inkandswitch/subscribables";
import { from, onCleanup, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

/**
 * Subscribes to a Subscribable and returns a reactive accessor.
 *
 * For SubscribableObject: Uses Solid's `from` to convert the subscribable to a Solid signal.
 * For SubscribableValue: Uses a store with `reconcile` for efficient deep updates.
 */
export function useSubscribe<T extends object>(
  subscribable: SubscribableObject<T>
): Accessor<T>;
export function useSubscribe<T>(
  subscribable: SubscribableValue<T>
): Accessor<T>;
export function useSubscribe<T>(subscribable: Subscribable<T>): Accessor<T>;
export function useSubscribe<T>(
  subscribable: Subscribable<T> | undefined
): Accessor<T | undefined>;
export function useSubscribe<T>(
  subscribable: Subscribable<T>
): Accessor<T | undefined> {
  if (isSubscribableValue(subscribable)) {
    // For SubscribableValue: use createStore with reconcile for granular updates
    const [store, setStore] = createStore<{ value: T }>({
      value: subscribable.value,
    });

    const unsubscribe = subscribable.subscribe((newValue) => {
      setStore(reconcile({ value: newValue }));
    });

    onCleanup(unsubscribe);

    return () => store.value;
  }

  // For SubscribableObject: use Solid's `from` to convert to a Solid signal
  return from<T>(subscribable, subscribable) as Accessor<T>;
}
