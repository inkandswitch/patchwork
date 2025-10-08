// Note: solid-js is expected as a peer dependency
import { createSignal, createEffect, onCleanup, createMemo } from "solid-js";
import { Reactive } from "../reactive";
import { CONTEXT } from "../core";

export const createReactive = <T>(
  reactiveOrFn: Reactive<T> | (() => Reactive<T>)
) => {
  const reactive = createMemo(() =>
    typeof reactiveOrFn === "function" ? reactiveOrFn() : reactiveOrFn
  );

  const [value, setValue] = createSignal(reactive().value);

  createEffect(() => {
    const currentReactive = reactive();

    const handleChange = (newValue: T) => setValue(() => newValue);
    currentReactive.on("change", handleChange);

    onCleanup(() => {
      currentReactive.emit("destroy");
      currentReactive.off("change", handleChange);
    });
  });

  return value;
};

export const createSubcontext = () => {
  const subcontext = CONTEXT.subcontext();

  onCleanup(() => {
    CONTEXT.remove(subcontext);
  });

  return subcontext;
};
