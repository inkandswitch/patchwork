import {
  unwrapObservable,
  type Observable,
  type ObservableValue,
} from "./observable";

/**
 * A computed observable that derives its value from one or more source observables.
 * Automatically recomputes when any source observable changes.
 */
class Computed<Result> implements ObservableValue<Result> {
  private subscribers = new Set<(value: Result) => void>();
  private cachedValue: Result;
  private unsubscribes: (() => void)[] = [];

  constructor(
    private sources: Observable[],
    private computeFn: (...values: any[]) => Result
  ) {
    this.cachedValue = this.compute();

    // Subscribe to all source observables
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
    const values = this.sources.map((s) => unwrapObservable(s));
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

/** Maps a tuple of Observables to a tuple of their value types */
type UnwrappedObservables<T extends readonly Observable[]> = {
  [K in keyof T]: T[K] extends Observable<infer V> ? V : never;
};

/**
 * Create a computed observable that derives its value from one or more source observables.
 *
 * @example
 * ```ts
 * const firstName = createObservable("John");
 * const lastName = createObservable("Doe");
 * const fullName = compute(firstName, lastName, (first, last) => `${first} ${last}`);
 * console.log(fullName.value); // "John Doe"
 * ```
 */
export function computed<const Sources extends readonly Observable[], Result>(
  ...args: [...Sources, (...values: UnwrappedObservables<Sources>) => Result]
): ObservableValue<Result> {
  const computeFn = args.pop() as (...values: any[]) => Result;
  const sources = args as unknown as Observable[];
  return new Computed(sources, computeFn);
}
