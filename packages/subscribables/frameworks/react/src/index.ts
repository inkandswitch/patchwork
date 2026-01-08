import {
  valueOfSubscribable,
  type Subscribable,
} from "@inkandswitch/subscribables";
import { useEffect, useState } from "react";

export function useSubscribe<T>(subscribable: Subscribable<T>): T;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined;
export function useSubscribe<T>(subscribable?: Subscribable<T>): T | undefined {
  const forceUpdate = useForceUpdate();

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
