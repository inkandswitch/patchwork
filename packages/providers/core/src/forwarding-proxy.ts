/**
 * Wrap `overrides` in a Proxy that serves the listed `owned` properties from
 * `overrides` itself and transparently forwards every other access to
 * `backing`.
 *
 * Both sides are read with the matching receiver and functions are bound to
 * their owner: owned members run against `overrides` (so its private `#fields`
 * keep working) and forwarded members run against `backing` (so the borrowed
 * method gets the right `this`). This lets the overlay classes spell out only
 * the handful of members whose behavior differs and inherit the rest of the
 * large, evolving `Repo` / `DocHandle` surface for free.
 */
export function forwardingProxy<T>(
  overrides: object,
  backing: object,
  owned: ReadonlySet<PropertyKey>
): T {
  return new Proxy(overrides, {
    get(target, prop) {
      const source = owned.has(prop) ? target : backing;
      const value = Reflect.get(source, prop, source);
      return typeof value === "function" ? value.bind(source) : value;
    },
    has(target, prop) {
      return owned.has(prop) || prop in backing || prop in target;
    },
  }) as T;
}
