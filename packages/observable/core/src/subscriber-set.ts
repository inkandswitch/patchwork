/**
 * A simple class for managing subscriptions with subscribe/notify pattern.
 */
export class SubscriberSet<T = unknown> {
  #subscribers = new Set<(value: T) => void>();

  /**
   * Subscribe to changes. Returns an unsubscribe function.
   */
  add(callback: (value: T) => void): () => void {
    this.#subscribers.add(callback);

    return () => {
      this.#subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers with a value.
   */
  notify(value: T): void {
    for (const callback of this.#subscribers) {
      callback(value);
    }
  }
}
