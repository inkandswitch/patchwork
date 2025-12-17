import EventEmitter from "eventemitter3";
import type { Observable } from "./observable";

/**
 * A base class that combines EventEmitter with the Observable pattern,
 * providing a generic minimal solution for observability that works across frameworks.
 *
 * ## Why this exists
 *
 * The `Observable` interface is intentionally simple so that:
 * - Reactive frameworks (Solid, Vue, etc.) can easily integrate with their signals
 * - Non-reactive frameworks (React) can subscribe and re-render on changes
 *
 * However, Observable only provides coarse-grained reactivity (the whole object changed).
 * By extending EventEmitter, subclasses can also emit fine-grained, typed events for
 * specific state changes.
 *
 * Application developers should mostly use the Observable interface for simplicity.
 * The fine-grained events can be used for framework-specific bindings or library
 * internals that require more granular reactivity.
 *
 * @typeParam Events - A record of event names to their handler signatures
 */
export abstract class ObservableEventEmitter<
    Events extends EventEmitter.ValidEventTypes = string | symbol,
    Value = unknown,
  >
  extends EventEmitter<Events>
  implements Observable<Value>
{
  private subscribers = new Set<(value: any) => void>();

  /**
   * Subscribe to changes. The callback is invoked immediately with the current
   * state, and again whenever notifySubscribers() is called.
   *
   * @returns An unsubscribe function
   */
  subscribe(callback: (value: Value) => void): () => void {
    this.subscribers.add(callback);

    // Notify immediately with current state
    callback(this.value);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all Observable subscribers of a change.
   * Call this in subclasses after state mutations.
   */
  protected notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback(this);
    }
  }

  abstract get value(): Value;
}
