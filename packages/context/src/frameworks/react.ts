import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { CONTEXT, PathRef, Ref } from "../core";
import { Context } from "../core/context";
import { Reactive } from "../reactive";

export function useReactive<T>(reactive: Reactive<T>): T;
export function useReactive<T>(reactive: undefined): undefined;
export function useReactive<T>(
  reactive: undefined | Reactive<T>
): T | undefined;
export function useReactive<T>(
  reactive: Reactive<T> | undefined
): T | undefined {
  const [value, setValue] = useState(reactive?.value);

  useEffect(() => {
    if (reactive) {
      reactive.on("change", setValue);
    }
  }, [reactive]);

  return value;
}

type UseDocRefHandleSuspendingParams = {
  suspense: true;
};
type UseDocRefHandleSynchronousParams = {
  suspense: false;
};

type UseDocRefParams =
  | UseDocRefHandleSuspendingParams
  | UseDocRefHandleSynchronousParams;

export function useDocRef<T>(
  docUrl: AutomergeUrl,
  params: UseDocRefHandleSuspendingParams
): Ref<T, T>;
export function useDocRef<T>(
  docUrl: AutomergeUrl | undefined,
  params?: UseDocRefHandleSynchronousParams | undefined
): Ref<T, T> | undefined;
export function useDocRef<T = unknown>(
  docUrl: AutomergeUrl | undefined,
  params?:
    | UseDocRefHandleSynchronousParams
    | UseDocRefHandleSuspendingParams
    | undefined
): Ref<T, T> | undefined {
  const docHandle = useDocHandle(
    docUrl,
    params as UseDocRefHandleSynchronousParams
  );

  return useMemo(
    () => (docHandle ? (new PathRef(docHandle, []) as Ref<T, T>) : undefined),
    [docHandle]
  );
}

export const useSubcontext = (id: string) => {
  const [subcontext] = useState<Context>(() => CONTEXT.subcontext(id));
  const subcontextRef = useRef<Context>(subcontext);

  useEffect(
    () => () => {
      CONTEXT.remove(subcontextRef!.current);
    },
    []
  );

  return subcontext;
};

export const useRefValue = <T>(ref?: Ref<T>): T | undefined => {
  const [doc] = useDocument(ref?.docHandle.url);

  return useMemo(() => {
    void doc; // make eslint happy memo should rerun when doc changes

    if (!ref) {
      return undefined;
    }

    return ref.value;
  }, [ref, doc]);
};
