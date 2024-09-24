import { useCallback, useMemo } from "react";
import { useValue } from "signia-react";
import { asyncComputed, AsyncState } from "./core";

/**
 * React hook. Given an async-signal callback, returns an AsyncState
 * (which might be a rejection). */
export function useAsyncComputed<T>(cb: () => T): AsyncState<T> {
  const signal = useMemo(() => asyncComputed("", cb), [cb]);
  return useValue(signal);
}

/**
 * React hook. Convenience wrapper for calling a constant function
 * (designed to be run inside a reactive context) with
 * possibly-variable arguments.
 */
export function useAsyncCall<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  ...args: Args
): AsyncState<Return> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useAsyncComputed(useCallback(() => fn(...args), args));
}
