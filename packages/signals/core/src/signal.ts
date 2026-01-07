export type SignalValue<T> = {
  subscribe: (callback: (value: T) => void) => () => void;
  value: T;
};

export type SignalObject<T> = T & {
  subscribe: (callback: (value: T) => void) => () => void;
  value?: never; // signal objects cannot have a value
};

export type Signal<T = unknown> = SignalValue<T> | SignalObject<T>;

export function valueOfSignal<T>(signal: Signal<T>): T {
  if ("value" in signal) {
    return (signal as SignalValue<T>).value;
  }
  return signal;
}

export function isSignalValue<T>(
  signal: Signal<T>
): signal is SignalValue<T> {
  return "value" in signal;
}
