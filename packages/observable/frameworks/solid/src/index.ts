import {
  isObservableValue,
  type Observable,
  type ObservableObject,
  type ObservableValue,
} from "@inkandswitch/observable";
import { from, onCleanup, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

/**
 * Subscribes to an Observable and returns a reactive accessor.
 *
 * For ObservableObject: Uses Solid's `from` to convert the observable to a signal.
 * For ObservableValue: Uses a store with `reconcile` for efficient deep updates.
 */
export function useObservable<T extends object>(
  observable: ObservableObject<T>
): Accessor<T>;
export function useObservable<T>(observable: ObservableValue<T>): Accessor<T>;
export function useObservable<T>(observable: Observable<T>): Accessor<T>;
export function useObservable<T>(
  observable: Observable<T> | undefined
): Accessor<T | undefined>;
export function useObservable<T>(
  observable: Observable<T>
): Accessor<T | undefined> {
  if (isObservableValue(observable)) {
    // For ObservableValue: use createStore with reconcile for granular updates
    const [store, setStore] = createStore<{ value: T }>({
      value: observable.value,
    });

    const unsubscribe = observable.subscribe((newValue) => {
      setStore(reconcile({ value: newValue }));
    });

    onCleanup(unsubscribe);

    return () => store.value;
  }

  // For ObservableObject: use Solid's `from` to convert to a signal
  return from<T>(observable, observable) as Accessor<T>;
}
