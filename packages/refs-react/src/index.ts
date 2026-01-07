import { Ref } from "@inkandswitch/patchwork-refs";
import { useCallback, useSyncExternalStore } from "react";

/**
 * React hook to subscribe to a Ref's value.
 * Uses useSyncExternalStore for optimal React 18 concurrent rendering support.
 *
 * @param ref - The Ref to subscribe to, or undefined
 * @returns The current value of the ref, or undefined if the ref is undefined or path can't be resolved
 *
 * @example
 * ```tsx
 * function TodoTitle({ titleRef }: { titleRef: Ref<string> }) {
 *   const title = useRefValue(titleRef);
 *   return <h1>{title ?? 'Untitled'}</h1>;
 * }
 * ```
 */
export function useRefValue<T>(ref: Ref<any, any>): T | undefined;
export function useRefValue<T>(ref: Ref<any, any> | undefined): T | undefined;
export function useRefValue<T>(ref?: Ref<any, any>): T | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!ref) {
        return () => {};
      }
      return ref.onChange(() => {
        onStoreChange();
      });
    },
    [ref]
  );

  const getSnapshot = useCallback(
    () => (ref ? (ref.value() as T | undefined) : undefined),
    [ref]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
