import {
  valueOfSubscribable,
  type Subscribable,
  type SubscribableValue,
} from "./subscribable";

/**
 * A computed subscribable that derives its value from one or more source subscribables.
 * Automatically recomputes when any source subscribable changes.
 */
class Computed<Result> implements SubscribableValue<Result> {
  private subscribers = new Set<(value: Result) => void>();
  private cachedValue: Result;
  private unsubscribes: (() => void)[] = [];

  constructor(
    private sources: Subscribable[],
    private computeFn: (...values: any[]) => Result
  ) {
    this.cachedValue = this.compute();

    // Subscribe to all source subscribables
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
    const values = this.sources.map((s) => valueOfSubscribable(s));
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

/** Maps a tuple of Subscribables to a tuple of their value types */
type UnwrappedSubscribables<T extends readonly Subscribable[]> = {
  [K in keyof T]: T[K] extends Subscribable<infer V> ? V : never;
};

/**
 * Create a computed subscribable that derives its value from one or more source subscribables.
 *
 * @example
 * ```ts
 * const firstName = createSubscribable("John");
 * const lastName = createSubscribable("Doe");
 * const fullName = compute(firstName, lastName, (first, last) => `${first} ${last}`);
 * console.log(fullName.value); // "John Doe"
 * ```
 */
export function computed<
  const Sources extends readonly Subscribable[],
  Result,
>(
  ...args: [...Sources, (...values: UnwrappedSubscribables<Sources>) => Result]
): SubscribableValue<Result> {
  const computeFn = args.pop() as (...values: any[]) => Result;
  const sources = args as unknown as Subscribable[];
  return new Computed(sources, computeFn);
}
