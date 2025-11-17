import { type Plugin } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { z } from "zod";
import { CounterDoc } from "./Counter";

// Increment the counter
export const incrementAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-increment",
  name: "Increment Counter",
  icon: "Plus",
  supportedDataTypes: ["counter"],
  module: {
    argsSchema: () => {
      return z.object({
        amount: z
          .number()
          .optional()
          .default(1)
          .describe("Amount to increment by"),
      });
    },
    default: (
      handle: DocHandle<CounterDoc>,
      _repo: any,
      args: { amount?: number }
    ) => {
      handle.change((doc) => {
        doc.value = (doc.value || 0) + (args.amount || 1);
      });
    },
  },
};

// Decrement the counter
export const decrementAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-decrement",
  name: "Decrement Counter",
  icon: "Minus",
  supportedDataTypes: ["counter"],
  module: {
    argsSchema: () => {
      return z.object({
        amount: z
          .number()
          .optional()
          .default(1)
          .describe("Amount to decrement by"),
      });
    },
    default: (
      handle: DocHandle<CounterDoc>,
      _repo: any,
      args: { amount?: number }
    ) => {
      handle.change((doc) => {
        doc.value = (doc.value || 0) - (args.amount || 1);
      });
    },
  },
};

// Reset the counter to zero
export const resetAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-reset",
  name: "Reset Counter",
  icon: "RotateCcw",
  supportedDataTypes: ["counter"],
  module: {
    default: (handle: DocHandle<CounterDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.value = 0;
      });
    },
  },
};

// Set the counter to a specific value
export const setValueAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-set-value",
  name: "Set Counter Value",
  icon: "Edit",
  supportedDataTypes: ["counter"],
  module: {
    argsSchema: () => {
      return z.object({
        value: z.number().describe("New value for the counter"),
      });
    },
    default: (
      handle: DocHandle<CounterDoc>,
      _repo: any,
      args: { value: number }
    ) => {
      handle.change((doc) => {
        doc.value = args.value;
      });
    },
  },
};

// Double the counter value
export const doubleAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-double",
  name: "Double Counter",
  icon: "ChevronsUp",
  supportedDataTypes: ["counter"],
  module: {
    default: (handle: DocHandle<CounterDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.value = (doc.value || 0) * 2;
      });
    },
  },
};

// Halve the counter value
export const halveAction: Plugin<any> = {
  type: "patchwork:action",
  id: "counter-halve",
  name: "Halve Counter",
  icon: "ChevronsDown",
  supportedDataTypes: ["counter"],
  module: {
    isApplicable: (doc: CounterDoc) => {
      return doc.value !== 0;
    },
    default: (handle: DocHandle<CounterDoc>, _repo: any) => {
      handle.change((doc) => {
        doc.value = Math.floor((doc.value || 0) / 2);
      });
    },
  },
};

