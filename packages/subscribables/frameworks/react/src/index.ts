import {
  valueOfSubscribable,
  type Subscribable,
} from "@inkandswitch/subscribables";
import { useEffect, useState } from "react";

export function useSubscribe<T>(subscribable: Subscribable<T>): T;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined {
  const forceUpdate = useForceUpdate();

  // we can't use useSyncExternalStore here because it ignores updates 
  // if the value returned by getSnapshot is the same as the previous value
  // this means it won't work with subscribable objects
  useEffect(() => {
    if (!subscribable) return;
    return subscribable.subscribe(() => {
      forceUpdate();
    });
  }, [subscribable]);

  return subscribable ? valueOfSubscribable(subscribable) : undefined;
}

function useForceUpdate(): () => void {
  const [, setState] = useState({});
  return () => setState({});
}
