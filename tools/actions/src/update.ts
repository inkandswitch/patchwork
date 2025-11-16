import { type Plugin } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { z } from "zod";

export const updateAction: Plugin<any> = {
  type: "patchwork:action",
  id: "update",
  name: "Update",
  icon: "Edit",
  supportedDataTypes: ["*"],
  module: {
    argsSchema: () => {
      return z.object({
        path: z
          .string()
          .describe(
            "The path to update (use dot notation for nested properties, e.g., 'user.name', or bracket notation for arrays, e.g., 'items[0].status')"
          ),
        value: z
          .any()
          .describe("The new value (can be any JSON-compatible type: string, number, boolean, object, array, or null)"),
      });
    },
    default: (
      handle: DocHandle<any>,
      _repo: any,
      args: { path: string; value: any }
    ) => {
      handle.change((doc) => {
        // Parse path to handle both dot notation and array indices
        // Examples: "user.name", "items[0]", "items[0].status", "data.tags[2]"
        const pathRegex = /([^.\[\]]+)|\[(\d+)\]/g;
        const pathParts: (string | number)[] = [];
        let match;

        while ((match = pathRegex.exec(args.path)) !== null) {
          if (match[1] !== undefined) {
            pathParts.push(match[1]); // Property name
          } else if (match[2] !== undefined) {
            pathParts.push(parseInt(match[2], 10)); // Array index
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
            // Array index
            if (!Array.isArray(current)) {
              throw new Error(`Cannot access index ${part} on non-array at path segment ${i}`);
            }
            if (part < 0 || part >= current.length) {
              throw new Error(`Array index ${part} out of bounds (length: ${current.length})`);
            }
            current = current[part];
          } else {
            // Property name
            if (!(part in current)) {
              // Determine if next part is an array index to create array or object
              const nextPart = pathParts[i + 1];
              current[part] = typeof nextPart === 'number' ? [] : {};
            }
            current = current[part];
          }
        }

        const finalKey = pathParts[pathParts.length - 1];

        // Set the value
        if (typeof finalKey === 'number') {
          if (!Array.isArray(current)) {
            throw new Error(`Cannot set array index on non-array`);
          }
          if (finalKey < 0 || finalKey >= current.length) {
            throw new Error(`Array index ${finalKey} out of bounds (length: ${current.length})`);
          }
          current[finalKey] = args.value;
        } else {
          current[finalKey] = args.value;
        }
      });
    },
  },
};
