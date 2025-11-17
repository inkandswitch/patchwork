import { Plugin } from "@patchwork/plugins";
import {
  incrementAction,
  decrementAction,
  resetAction,
  setValueAction,
  doubleAction,
  halveAction,
} from "./actions";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "Hash",
    supportedDataTypes: ["counter"],
    async load() {
      const { renderCounterEditor } = await import("./Counter");
      return renderCounterEditor;
    },
  },
  {
    type: "patchwork:datatype",
    id: "counter",
    name: "Counter",
    icon: "Hash",
    async load() {
      const { CounterDataType } = await import("./datatype");
      return CounterDataType;
    },
  },
  // Counter actions
  incrementAction,
  decrementAction,
  resetAction,
  setValueAction,
  doubleAction,
  halveAction,
];

