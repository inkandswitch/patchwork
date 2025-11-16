import { type Plugin } from "@patchwork/plugins";
import { type DocHandle } from "@automerge/automerge-repo";
import { z } from "zod";

export const insertAction: Plugin<any> = {
  type: "patchwork:action",
  id: "insert",
  name: "Insert",
  icon: "Plus",
  supportedDataTypes: ["*"],
  module: {
    argsSchema: () => {
      return z.object({
        path: z
          .string()
          .describe(
            "The path where to insert (for arrays, use the array path like 'items'; for objects, use the full property path like 'user.email')"
          ),
        value: z
          .any()
          .describe("The value to insert (can be any JSON-compatible type)"),
        position: z
          .enum(["start", "end", "before", "after"])
          .optional()
          .describe(
            "For arrays: where to insert the item. 'before'/'after' require index parameter"
          ),
        index: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("For 'before'/'after' positions: the reference index"),
      });
    },
    default: (
      handle: DocHandle<any>,
      _repo: any,
      args: { path: string; value: any; position?: string; index?: number }
    ) => {
      handle.change((doc) => {
        // Parse path
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

        // Navigate to the target
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];

          if (typeof part === "number") {
            if (!Array.isArray(current)) {
              throw new Error(`Cannot access index ${part} on non-array`);
            }
            current = current[part];
          } else {
            if (!(part in current)) {
              // Create intermediate objects/arrays as needed
              const nextPart = pathParts[i + 1];
              current[part] = typeof nextPart === "number" ? [] : {};
            }
            current = current[part];
          }
        }

        const finalKey = pathParts[pathParts.length - 1];

        if (typeof finalKey === "number") {
          throw new Error(
            "Cannot insert at an array index. Use the array path itself and specify position."
          );
        }

        // Handle insertion
        if (!(finalKey in current)) {
          // Property doesn't exist, create it
          // If position is specified, assume it's an array
          if (args.position) {
            current[finalKey] = [args.value];
          } else {
            current[finalKey] = args.value;
          }
        } else if (Array.isArray(current[finalKey])) {
          // Insert into array
          const array = current[finalKey];
          const position = args.position || "end";

          switch (position) {
            case "start":
              array.unshift(args.value);
              break;
            case "end":
              array.push(args.value);
              break;
            case "before":
              if (args.index === undefined) {
                throw new Error("'before' position requires an index");
              }
              if (args.index < 0 || args.index > array.length) {
                throw new Error(`Index ${args.index} out of bounds`);
              }
              array.splice(args.index, 0, args.value);
              break;
            case "after":
              if (args.index === undefined) {
                throw new Error("'after' position requires an index");
              }
              if (args.index < 0 || args.index >= array.length) {
                throw new Error(`Index ${args.index} out of bounds`);
              }
              array.splice(args.index + 1, 0, args.value);
              break;
          }
        } else {
          // Property exists and is not an array - overwrite or error?
          if (args.position) {
            throw new Error(
              `Property "${args.path}" exists but is not an array. Cannot use position parameter.`
            );
          }
          current[finalKey] = args.value;
        }
      });
    },
  },
};
