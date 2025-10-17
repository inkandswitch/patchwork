import {
  AnyDocumentId,
  AutomergeUrl,
  DocHandle,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { CONTEXT, PathRef, Ref } from "../core";
import { Context } from "../core/context";
import { Reactive } from "../reactive";

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

    setValue(reactive.value);

    return () => {
      reactive.emit("destroy");
    };
  }, [reactiveOrFn]);

  return value;
};

export const useDocRef = <T = unknown>(
  docUrl?: AutomergeUrl
): Ref<T, T, never> | undefined => {
  // todo: useDochandle has a bug
  // const docHandle = useDocHandle(docUrl);
  const docHandle = useSimpleDocHandle(docUrl);

  return useMemo(
    () =>
      docHandle ? (new PathRef(docHandle, []) as Ref<T, T, never>) : undefined,
    [docHandle]
  );
};

export const useSimpleDocHandle = (id?: AnyDocumentId) => {
  const repo = useRepo();
  const [handle, setHandle] = useState<DocHandle<unknown> | undefined>();

  useEffect(() => {
    if (!id) return;

    let canceled = false;

    setHandle(undefined);

    repo.find(id).then((handle) => {
      if (canceled) return;
      setHandle(handle);
    });

    return () => {
      canceled = true;
    };
  }, [id]);

  return handle;
};

export const useSubcontext = (id?: string) => {
  const [subcontext] = useState<Context>(() => CONTEXT.subcontext());
  const subcontextRef = useRef<Context>(subcontext);

  useEffect(() => {
    return () => {
      CONTEXT.remove(subcontextRef!.current);
    };
  }, []);

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
