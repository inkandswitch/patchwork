// Note: solid-js is expected as a peer dependency
import { CONTEXT, Reactive } from "@patchwork/context";
import { createSignal, createEffect, onCleanup, createMemo } from "solid-js";

export const createReactive = <T>(
  reactiveOrFn: Reactive<T> | (() => Reactive<T>),
  owned: boolean = true
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
      if (owned) {
        // Unsubscribe and destroy since it's local to this component
        currentReactive.off("change", handleChange);
        currentReactive.emit("destroy");
      } else {
        // Unsubscribe from change events, but don't destroy since it may be shared across components
        currentReactive.off("change", handleChange);
      }
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
