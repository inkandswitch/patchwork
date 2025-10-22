import { CONTEXT } from ".";
import { Reactive } from "../reactive";
import { Context } from "./context";

export const contextComputation = <T>(
  computation: (context: Context) => T
): Reactive<T> => {
  const reactive = new Reactive<T>(computation(CONTEXT));

  const onChange = () => {
    reactive.set(computation(CONTEXT));
  };

  CONTEXT.subscribe(onChange);

  reactive.on("destroy", () => {
    console.log("unsubscribe contextComputation", computation);
    CONTEXT.unsubscribe(onChange);
  });

  return reactive;
};
