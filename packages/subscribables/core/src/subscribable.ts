export type SubscribableValue<T> = {
  subscribe: (callback: (value: T) => void) => () => void;
  value: T;
};

export type SubscribableObject<T> = T & {
  subscribe: (callback: (value: T) => void) => () => void;
  value?: never; // subscribable objects cannot have a value
};

export type Subscribable<T = unknown> =
  | SubscribableValue<T>
  | SubscribableObject<T>;

export function valueOfSubscribable<T>(subscribable: Subscribable<T>): T {
  if ("value" in subscribable) {
    return (subscribable as SubscribableValue<T>).value;
  }
  return subscribable;
}

export function isSubscribableValue<T>(
  subscribable: Subscribable<T>
): subscribable is SubscribableValue<T> {
  return "value" in subscribable;
}
