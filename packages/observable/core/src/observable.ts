export type ObservableValue<T> = {
  subscribe: (callback: (value: T) => void) => () => void;
  value: T;
};

export type ObservableObject<T> = T & {
  subscribe: (callback: (value: T) => void) => () => void;
  value?: never; // observable objects cannot have a value
};

export type Observable<T = unknown> = ObservableValue<T> | ObservableObject<T>;

export function unwrapObservable<T>(observable: Observable<T>): T {
  if ("value" in observable) {
    return (observable as ObservableValue<T>).value;
  }
  return observable;
}

export function isObservableValue<T>(
  observable: Observable<T>
): observable is ObservableValue<T> {
  return "value" in observable;
}
