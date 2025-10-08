import { Reactive } from "../reactive";
import { CONTEXT } from ".";
import { Context } from "./context";

export const contextComputation = <T>(
  computation: (context: Context) => T
): Reactive<T> => {
  const api = new Reactive<T>(computation(CONTEXT));

  CONTEXT.subscribe(() => {
    api.set(computation(CONTEXT));
  });

  return api;
};
