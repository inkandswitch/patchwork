type MemoizeResolver<TArgs extends readonly unknown[], TKey> = (
  ...args: TArgs
) => TKey;

export const memoize = <
  TArgs extends readonly unknown[],
  TReturn extends WeakKey,
  TKey = string
>(
  fn: (...args: TArgs) => TReturn,
  resolver?: MemoizeResolver<TArgs, TKey>
): ((...args: TArgs) => TReturn) => {
  type CacheKey = TKey extends string ? string : TKey;
  const cache = new Map<CacheKey, WeakRef<TReturn>>();

  // FinalizationRegistry to clean up cache entries when values are garbage collected
  const registry = new FinalizationRegistry<CacheKey>((key) => {
    cache.delete(key);
  });

  return function memoized(...args: TArgs): TReturn {
    // Generate cache key
    const key: CacheKey = resolver
      ? (resolver(...args) as CacheKey)
      : (JSON.stringify(args) as CacheKey);

    // Check if we have a cached value
    const weakRef = cache.get(key);
    if (weakRef) {
      const cachedValue = weakRef.deref();
      if (cachedValue !== undefined) {
        return cachedValue;
      }
      // If the weak reference is dead, remove it from cache
      cache.delete(key);
    }

    // Compute new value
    const result = fn(...args);

    // Cache the result since TReturn extends WeakKey (objects/functions)
    cache.set(key, new WeakRef(result));

    // Register for cleanup when the result is garbage collected
    registry.register(result, key);

    return result;
  };
};
