import * as Automerge from "@automerge/automerge";
import type { Prop } from "@automerge/automerge";
import type { MutableText as IMutableText } from "./types";

/**
 * Create a MutableText with a Proxy that forwards all string methods.
 */
export function MutableText(
  doc: any,
  propPath: Prop[],
  value: string
): IMutableText {
  const target = {
    splice(index: number, deleteCount: number, insert?: string): void {
      Automerge.splice(doc, propPath, index, deleteCount, insert);
    },
    updateText(newValue: string): void {
      Automerge.updateText(doc, propPath, newValue);
    },
  };

  return new Proxy(target, {
    get(_, prop) {
      // Our custom Automerge mutation methods
      if (prop in target) {
        return (target as any)[prop];
      }

      // Forward everything else to the underlying string value
      const stringProp = (value as any)[prop];

      if (typeof stringProp === "function") {
        return stringProp.bind(value);
      }

      return stringProp;
    },
  }) as IMutableText;
}
