import { MutableRefObject, useRef } from "react";

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

// Object.entries with better types
export function objectEntries<T extends object>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}

export type FromEntries<T> = T extends ReadonlyArray<
  readonly [infer K extends string | number | symbol, infer _V]
>
  ? { [key in K]: Extract<T[number], readonly [key, any]>[1] }
  : never;

// Object.fromEntries with better types
export function objectFromEntries<
  T extends ReadonlyArray<readonly [PropertyKey, any]>
>(entries: T): FromEntries<T> {
  return Object.fromEntries(entries) as FromEntries<T>;
}

export function typeOnlyAssert(condition: boolean): asserts condition {}

export function canBeUndef<T>(x: T): T | undefined {
  return x;
}

export const tuple = <T extends any[]>(...args: T): T => args;

export function eventListenerEffect<K extends keyof HTMLElementEventMap>(
  elem: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
): () => void {
  elem.addEventListener(type, listener);
  return () => elem.removeEventListener(type, listener);
}

/** Define a ref that's always kept in sync with a certain value so a callback
 * can use the up-to-date value without having to be redefined when the value
 * changes.
 */
export function useRefForCallback<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
