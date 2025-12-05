export type Observable<T = any> = {
  subscribe: (callback: (value: T) => void) => () => void;
};
