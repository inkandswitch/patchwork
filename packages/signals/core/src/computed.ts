import {
  valueOfSignal,
  type Signal,
  type SignalValue,
} from "./signal";

/**
 * A computed signal that derives its value from one or more source signals.
 * Automatically recomputes when any source signal changes.
 */
class Computed<Result> implements SignalValue<Result> {
  private subscribers = new Set<(value: Result) => void>();
  private cachedValue: Result;
  private unsubscribes: (() => void)[] = [];

  constructor(
    private sources: Signal[],
    private computeFn: (...values: any[]) => Result
  ) {
    this.cachedValue = this.compute();

    // Subscribe to all source signals
    for (const source of sources) {
      const unsubscribe = source.subscribe(() => {
        const newValue = this.compute();
        if (newValue !== this.cachedValue) {
          this.cachedValue = newValue;
          this.notifySubscribers();
        }
      });
      this.unsubscribes.push(unsubscribe);
    }
  }

  private compute(): Result {
    const values = this.sources.map((s) => valueOfSignal(s));
    return this.computeFn(...values);
  }

  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this.cachedValue);
    }
  }

  get value(): Result {
    return this.cachedValue;
  }

  subscribe(callback: (value: Result) => void): () => void {
    this.subscribers.add(callback);
    callback(this.cachedValue);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

/** Maps a tuple of Signals to a tuple of their value types */
type UnwrappedSignals<T extends readonly Signal[]> = {
  [K in keyof T]: T[K] extends Signal<infer V> ? V : never;
};

/**
 * Create a computed signal that derives its value from one or more source signals.
 *
 * @example
 * ```ts
 * const firstName = createSignal("John");
 * const lastName = createSignal("Doe");
 * const fullName = compute(firstName, lastName, (first, last) => `${first} ${last}`);
 * console.log(fullName.value); // "John Doe"
 * ```
 */
export function computed<const Sources extends readonly Signal[], Result>(
  ...args: [...Sources, (...values: UnwrappedSignals<Sources>) => Result]
): SignalValue<Result> {
  const computeFn = args.pop() as (...values: any[]) => Result;
  const sources = args as unknown as Signal[];
  return new Computed(sources, computeFn);
}
