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
