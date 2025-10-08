import { useEffect, useMemo, useRef, useState } from "react";
import { Reactive } from "../reactive";
import { CONTEXT, PathRef, Ref } from "../core";
import { Context } from "../core/context";
import { useDocHandle } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/automerge-repo";

export const useReactive = <T>(
  reactiveOrFn: Reactive<T> | (() => Reactive<T>)
): T => {
  const reactive = useMemo(
    () => (typeof reactiveOrFn === "function" ? reactiveOrFn() : reactiveOrFn),
    [reactiveOrFn]
  );

  const [value, setValue] = useState(reactive.value);

  useEffect(() => {
    const reactive =
      typeof reactiveOrFn === "function" ? reactiveOrFn() : reactiveOrFn;

    reactive.on("change", setValue);

    return () => {
      reactive.emit("destroy");
    };
  }, [reactiveOrFn]);

  return value;
};

export const useDocRef = <T = unknown>(
  docUrl?: AutomergeUrl
): Ref<T, T, never> | undefined => {
  const docHandle = useDocHandle(docUrl);
  return useMemo(
    () =>
      docHandle ? (new PathRef(docHandle, []) as Ref<T, T, never>) : undefined,
    [docHandle]
  );
};

export const useSubcontext = () => {
  const [subcontext] = useState<Context>(() => CONTEXT.subcontext());
  const subcontextRef = useRef<Context>(subcontext);

  useEffect(() => {
    return () => {
      CONTEXT.remove(subcontextRef!.current);
    };
  }, []);

  return subcontext;
};
