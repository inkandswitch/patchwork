import { type Plugin } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { z } from "zod";

export const deleteAction: Plugin<any> = {
  type: "patchwork:action",
  id: "delete",
  name: "Delete",
  icon: "Trash",
  supportedDataTypes: ["*"],
  module: {
    argsSchema: () => {
      return z.object({
        path: z
          .string()
          .describe(
            "The path to delete (use dot notation for properties, e.g., 'user.email', or bracket notation for array elements, e.g., 'items[0]')"
          ),
      });
    },
    default: (
      handle: DocHandle<any>,
      _repo: any,
      args: { path: string }
    ) => {
      handle.change((doc) => {
        // Parse path to handle both dot notation and array indices
        const pathRegex = /([^.\[\]]+)|\[(\d+)\]/g;
        const pathParts: (string | number)[] = [];
        let match;

        while ((match = pathRegex.exec(args.path)) !== null) {
          if (match[1] !== undefined) {
            pathParts.push(match[1]);
          } else if (match[2] !== undefined) {
            pathParts.push(parseInt(match[2], 10));
          }
        }

        if (pathParts.length === 0) {
          throw new Error(`Invalid path: "${args.path}"`);
        }

        let current = doc;

        // Navigate to the parent of the target
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];

          if (typeof part === 'number') {
            if (!Array.isArray(current)) {
              throw new Error(`Cannot access index ${part} on non-array`);
            }
            if (part < 0 || part >= current.length) {
              throw new Error(`Array index ${part} out of bounds`);
            }
            current = current[part];
          } else {
            if (!(part in current)) {
              throw new Error(`Property path "${args.path}" not found`);
            }
            current = current[part];
          }
        }

        const finalKey = pathParts[pathParts.length - 1];

        // Delete the target
        if (typeof finalKey === 'number') {
          if (!Array.isArray(current)) {
            throw new Error(`Cannot delete array index on non-array`);
          }
          if (finalKey < 0 || finalKey >= current.length) {
            throw new Error(`Array index ${finalKey} out of bounds (length: ${current.length})`);
          }
          current.splice(finalKey, 1);
        } else {
          if (!(finalKey in current)) {
            throw new Error(`Property "${args.path}" does not exist`);
          }
          delete current[finalKey];
        }
      });
    },
  },
};
