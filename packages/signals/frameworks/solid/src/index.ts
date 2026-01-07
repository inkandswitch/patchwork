import {
  isSignalValue,
  type Signal,
  type SignalObject,
  type SignalValue,
} from "@inkandswitch/signals";
import { from, onCleanup, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

/**
 * Subscribes to a Signal and returns a reactive accessor.
 *
 * For SignalObject: Uses Solid's `from` to convert the signal to a Solid signal.
 * For SignalValue: Uses a store with `reconcile` for efficient deep updates.
 */
export function usePatchworkSignal<T extends object>(
  signal: SignalObject<T>
): Accessor<T>;
export function usePatchworkSignal<T>(signal: SignalValue<T>): Accessor<T>;
export function usePatchworkSignal<T>(signal: Signal<T>): Accessor<T>;
export function usePatchworkSignal<T>(
  signal: Signal<T> | undefined
): Accessor<T | undefined>;
export function usePatchworkSignal<T>(
  signal: Signal<T>
): Accessor<T | undefined> {
  if (isSignalValue(signal)) {
    // For SignalValue: use createStore with reconcile for granular updates
    const [store, setStore] = createStore<{ value: T }>({
      value: signal.value,
    });

    const unsubscribe = signal.subscribe((newValue) => {
      setStore(reconcile({ value: newValue }));
    });

    onCleanup(unsubscribe);

    return () => store.value;
  }

  // For SignalObject: use Solid's `from` to convert to a Solid signal
  return from<T>(signal, signal) as Accessor<T>;
}
