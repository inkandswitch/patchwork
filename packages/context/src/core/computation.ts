import { Reactive } from "../reactive";
import { CONTEXT } from ".";
import { Context } from "./context";
import { Diff } from "../apis/diff";

export const contextComputation = <T>(
  computation: (context: Context) => T
): Reactive<T> => {
  const reactive = new Reactive<T>(computation(CONTEXT));

  const onChange = () => {
    reactive.set(computation(CONTEXT));
  };

  CONTEXT.subscribe(onChange);

  reactive.on("destroy", () => CONTEXT.unsubscribe(onChange));

  return reactive;
};
