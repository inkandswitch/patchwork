import { atom, computed, react, Signal } from "signia";

/**
 * async-signals is a little library for computing values that depend
 * on changing values, where the values and computations might be
 * asynchronous. The motivating use-case is computations that depend
 * on possibly-changing Automerge documents.
 *
 * Structurally, it's a pretty thin wrapper on Signia signals. The
 * wrapping is needed to handle asynchronous stuff: pending values
 * and error states. In short:
 *  > AsyncSignal<T> = Signal<AsyncState<T>>.
 *
 * Convention: Some functions are meant to be used only inside of
 * async-signal callbacks – they will throw PendingException to mark
 * that they're pending. Such functions are marked with a "fetch"
 * prefix.
 */

/******************/
/* App-facing API */
/******************/

// eslint-disable-next-line @typescript-eslint/no-namespace
export module AsyncState {
  abstract class Base<T> {
    /**
     * Get an AsyncState's value, probably inside an async-signal
     * callback. If the state is pending, this will throw a
     * PendingException so the computed async-signal will likewise be
     * pending. If the state is rejected, this will throw the error
     * so the computed async-signal will likewise be rejected.
     */
    abstract fetch: T;

    /**
     * Get an AsyncState's value, probably outside an async-signal
     * callback, using a provided callback if the state is pending.
     */
    abstract ifPending<U>(onPending: U | (() => U)): T | U;
  }

  export class Pending<T> extends Base<T> {
    state = "pending" as const;
    constructor(readonly description?: string) {
      super();
    }
    get fetch(): never {
      throw new PendingException(this.description);
    }
    ifPending<U>(onPending: U | (() => U)): U {
      return typeof onPending === "function"
        ? (onPending as () => U)()
        : onPending;
    }
  }

  export class Fulfilled<T> extends Base<T> {
    state = "fulfilled" as const;
    constructor(readonly _value: T) {
      super();
    }
    get fetch() {
      return this._value;
    }
    ifPending() {
      return this._value;
    }
  }

  export class Rejected<T> extends Base<T> {
    state = "rejected" as const;
    constructor(readonly error: unknown) {
      super();
    }
    get fetch(): never {
      throw this.error;
    }
    ifPending(): never {
      throw this.error;
    }
  }
}

export type AsyncState<T> =
  | AsyncState.Pending<T>
  | AsyncState.Fulfilled<T>
  | AsyncState.Rejected<T>;

export type AsyncStateUnrejected<T> =
  | AsyncState.Pending<T>
  | AsyncState.Fulfilled<T>;

export type AsyncSignal<T> = Signal<AsyncState<T>>;

export function asyncComputed<T>(name: string, cb: () => T): AsyncSignal<T> {
  return computed<AsyncState<T>>(name, () => asyncSignalCallbackToState<T>(cb));
}

/**
 * For use in (trad) async code. Waits for an async-signal callback
 * to be loaded, then resolves with the value.
 */
export function asyncComputedPromise<T>(cb: () => T): Promise<T> {
  const signal = asyncComputed("loadedValue", cb);
  return new Promise((resolve, reject) => {
    // `react` runs synchronously, but it can't unsubscribe during
    // this first run since `unsubscribe` itself isn't defined yet;
    // hence the `firstRun` / `workedOnFirstRun` dance.
    let firstRun = true;
    let workedOnFirstRun = false;
    const unsubscribe = react(`wait for ${signal.name} to be defined`, () => {
      if (signal.value instanceof AsyncState.Pending) {
        // still loading, keep waiting
        return;
      } else {
        // loaded, resolve/reject the promise
        if (!firstRun) {
          unsubscribe();
        } else {
          workedOnFirstRun = true;
        }
        if (signal.value instanceof AsyncState.Rejected) {
          reject(signal.value.error);
        } else {
          resolve(signal.value.fetch);
        }
      }
    });
    if (workedOnFirstRun) {
      unsubscribe();
    }
    firstRun = false;
  });
}

/**
 * Allows an array of callbacks to be run in parallel. If any of them
 * throws a PendingException, `parallel` will throw a
 * PendingException, but not until giving the other callbacks a
 * chance to run so they can make progress. This is analogous to
 * Promise.all in async code.
 */
export function fetchParallel<T>(cbs: (() => T)[]): T[] {
  // Run all the callbacks – no throwing here!
  const states = cbs.map(asyncSignalCallbackToState);
  const values: T[] = [];
  for (const state of states) {
    // This part might throw
    values.push(state.fetch);
  }
  return values;
}

/**
 * Maps a function across an array in parallel. If any of the
 * executions throws a PendingException, `parallel` will throw a
 * PendingException, but not until giving the other executions a
 * chance to run so they can make progress. This is analogous to a
 * use of `Promise.all` with `.map` in async code.
 */
export function fetchParallelMap<T, U>(values: T[], fn: (value: T) => U): U[] {
  return fetchParallel(values.map((value) => () => fn(value)));
}

/**
 * Warning: Don't refer to this dynamically in a callback! It needs
 * to be run in a stable context (outside a callback, or cached
 * somewhere), since it makes a new atom every time.
 *
 * TODO: Maybe we could use a weak map from the promise to the atom?
 * But I don't want to think about that.
 */
export function asyncComputedFromPromise<T>(
  promise: Promise<T>
): AsyncSignal<T> {
  const signal = atom<AsyncState<T>>(
    "asyncComputedFromPromise",
    new AsyncState.Pending()
  );
  promise.then(
    (value) => {
      signal.set(new AsyncState.Fulfilled(value));
    },
    (error) => {
      signal.set(new AsyncState.Rejected(error));
    }
  );
  return signal;
}

/**
 * For use inside an async-signal callback. Interpret a missing
 * (falsey) value as a pending value.
 */
export function waitUntilPresent(
  condition: any,
  description?: string
): asserts condition {
  if (!condition) {
    throw new PendingException(description);
  }
}

/**********************/
/* Internal utilities */
/**********************/

export class PendingException extends Error {
  isPendingException = true; // here for weird typing reasons

  constructor(readonly description?: string) {
    super(description ?? "Pending value; should not be caught as an error!");
  }
}

/**
 * Run an async-signal callback to produce a state, possibly by
 * catching a PendingException or error.
 */
function asyncSignalCallbackToState<T>(cb: () => T): AsyncState<T> {
  try {
    return new AsyncState.Fulfilled(cb());
  } catch (e) {
    if (e instanceof PendingException) {
      return new AsyncState.Pending(e.description);
    } else {
      return new AsyncState.Rejected(e);
    }
  }
}
