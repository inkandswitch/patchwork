import type { Observable } from "@patchwork/observable";
import type { Accessor } from "solid-js";
import { onCleanup } from "solid-js";
import { createStore, reconcile, type ReconcileOptions } from "solid-js/store";

export type UseObservableOptions = ReconcileOptions;

/**
 * Subscribes to an Observable and returns a reactive accessor for its value.
 *
 * @param observable Observable instance to subscribe to.
 * @param options Optional reconcile options for fine-grained reactivity.
 * @returns Accessor for the observable's current value.
 */
export function useObservable<T>(
  observable?: Observable<T>,
  options: UseObservableOptions = {}
): Accessor<T | undefined> {
  if (!observable) {
    return () => undefined;
  }

  const [state, setState] = createStore<{ value: T }>({
    value: observable.value,
  });

  const unsubscribe = observable.subscribe((newValue) => {
    setState("value", reconcile(newValue, options));
  });

  onCleanup(() => unsubscribe());

  return () => state.value;
}

