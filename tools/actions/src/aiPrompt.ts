import { DocHandle } from "@automerge/automerge-repo";
import {
  type Plugin,
  getRegistry,
} from "@patchwork/plugins";

// AI Edit Prompt type definition
export interface AIEditPrompt {
  docToText: (doc: any) => string;
  textToDoc: (text: string) => any;
  prompt: string;
  edit: (handle: DocHandle<any>, newContent: any, context?: any) => Promise<void>;
}

// Global cache of loaded action plugins
const actionPluginCache = new Map<string, any>();

// Global cache of action descriptions by datatype
const actionDescriptionsByDatatype = new Map<string, any[]>();

// Track which datatypes we've already loaded
const loadedDatatypes = new Set<string>();

// Eagerly load and cache plugins for a datatype
async function ensurePluginsLoaded(dataTypeId: string) {
  if (loadedDatatypes.has(dataTypeId)) {
    return; // Already loaded
  }

  loadedDatatypes.add(dataTypeId);

  try {
    const registry = getRegistry("patchwork:action");
    const allActions = registry.all();

    // Filter actions that match the datatype
    const matchingActions = allActions.filter((action: any) => {
      const supportedDataTypes = action.supportedDataTypes;
      if (!supportedDataTypes) return false;
      if (supportedDataTypes === "*") return true;
      if (Array.isArray(supportedDataTypes)) {
        return supportedDataTypes.includes(dataTypeId) || supportedDataTypes.includes("*");
      }
      return supportedDataTypes === dataTypeId;
    });

    cacheActionDescriptions(dataTypeId, matchingActions);

    // Load all plugins
    await Promise.all(
      matchingActions.map(async (action: any) => {
        try {
          const plugin = await registry.load(action.id);
          if (plugin) {
            cacheActionPlugin(action.id, plugin);
          }
        } catch (e) {
          console.error(`Failed to load plugin ${action.id}:`, e);
        }
      })
    );
  } catch (e) {
    console.error(`Failed to load plugins for datatype ${dataTypeId}:`, e);
  }
}

// Populate the cache with a plugin
export function cacheActionPlugin(actionId: string, plugin: any) {
  actionPluginCache.set(actionId, plugin);
}

// Cache action descriptions for a datatype
export function cacheActionDescriptions(
  dataTypeId: string,
  descriptions: any[]
) {
  actionDescriptionsByDatatype.set(dataTypeId, descriptions);
}

// Synchronous version that uses the cache
export function getAvailableActionsForDocSync(
  doc: any,
  actionDescriptions: any[]
): string {
  const descriptions: string[] = [];

  for (const action of actionDescriptions) {
    const plugin = actionPluginCache.get(action.id);
    if (!plugin) {
      descriptions.push(
        `  - ${action.id}: ${action.name}\n    (Plugin not loaded yet)`
      );
      continue;
    }

    let argsDescription = "No arguments";
    if (plugin.module.argsSchema) {
      try {
        const schema = plugin.module.argsSchema(doc);

        // Check if this is a discriminated union (Zod 4 style)
        const isDiscriminatedUnion =
          (schema.constructor?.name === "ZodDiscriminatedUnion" ||
            (schema._def?.type === "union" && schema._def?.discriminator)) ??
          false;
        const discriminator = isDiscriminatedUnion
          ? schema._def?.discriminator
          : null;

        if (isDiscriminatedUnion && discriminator) {
          // Describe discriminated union
          const options = schema._def?.options || schema.options || [];
          const descriptions: string[] = [];

          for (const option of options) {
            const shape = option.def?.shape || option.shape || {};
            const discriminatorField = shape[discriminator];
            // In Zod 4, literal values are in .def.values[0]
            const discriminatorValue =
              discriminatorField?.def?.values?.[0] ||
              discriminatorField?._def?.value;

            if (!discriminatorValue) continue;

            descriptions.push(
              `\n  When ${discriminator} is "${discriminatorValue}":`
            );

            const fields = Object.entries(shape)
              .filter(([key]) => key !== discriminator) // Skip discriminator field
              .map(([key, value]: [string, any]) => {
                let isOptional = false;
                let innerType = value;
                // Unwrap for both Zod 3 (_def) and Zod 4 (.def)
                while (
                  innerType.def?.innerType ||
                  innerType.def?.schema ||
                  innerType._def?.innerType ||
                  innerType._def?.schema
                ) {
                  if (
                    innerType.def?.type === "optional" ||
                    innerType._def?.typeName === "ZodOptional"
                  ) {
                    isOptional = true;
                  }
                  innerType =
                    innerType.def?.innerType ||
                    innerType.def?.schema ||
                    innerType._def?.innerType ||
                    innerType._def?.schema;
                }

                const typeName =
                  innerType.type ||
                  innerType.def?.type ||
                  innerType._def?.typeName;
                const description =
                  value.description || innerType.description || "";
                const enumOptions =
                  (innerType as any).options ||
                  (innerType as any).enum ||
                  (innerType.def?.entries
                    ? Object.keys(innerType.def.entries)
                    : null);
                const isEnum = enumOptions && Array.isArray(enumOptions);

                const optionalMarker = isOptional ? " (optional)" : "";
                return `    - ${key}: ${
                  isEnum ? `enum (${enumOptions.join(" | ")})` : typeName
                }${optionalMarker}${description ? ` - ${description}` : ""}`;
              });

            descriptions.push(...fields);
          }

          const discriminatorValues = options
            .map((opt: any) => {
              const shape = opt.def?.shape || opt.shape;
              const discField = shape?.[discriminator];
              return discField?.def?.values?.[0] || discField?._def?.value;
            })
            .filter(Boolean);

          argsDescription = `Arguments (discriminated by ${discriminator}):\n  ${discriminator}: enum (${discriminatorValues.join(
            " | "
          )})${descriptions.join("\n")}`;
        } else {
          // Regular schema (or single-option discriminated union that returns the schema directly)
          // In Zod 4, shape is at .def.shape
          const shape =
            (schema as any).shape || schema.def?.shape || schema._def?.shape;

          if (shape && typeof shape === "object") {
            const fields = Object.entries(shape).map(
              ([key, value]: [string, any]) => {
                let isOptional = false;
                let innerType = value;
                // Unwrap for both Zod 3 (_def) and Zod 4 (.def)
                while (
                  innerType.def?.innerType ||
                  innerType.def?.schema ||
                  innerType._def?.innerType ||
                  innerType._def?.schema
                ) {
                  if (
                    innerType.def?.type === "optional" ||
                    innerType._def?.typeName === "ZodOptional"
                  ) {
                    isOptional = true;
                  }
                  innerType =
                    innerType.def?.innerType ||
                    innerType.def?.schema ||
                    innerType._def?.innerType ||
                    innerType._def?.schema;
                }

                const typeName =
                  innerType.type ||
                  innerType.def?.type ||
                  innerType._def?.typeName;
                const description =
                  value.description || innerType.description || "";
                const defaultValue =
                  value._def?.defaultValue || value.def?.defaultValue;
                const enumOptions =
                  (innerType as any).options ||
                  (innerType as any).enum ||
                  (innerType.def?.entries
                    ? Object.keys(innerType.def.entries)
                    : null);
                const isEnum = enumOptions && Array.isArray(enumOptions);

                // Handle ZodLiteral
                const isLiteral =
                  innerType.def?.type === "literal" ||
                  innerType._def?.typeName === "ZodLiteral";
                const literalValue = isLiteral
                  ? innerType.def?.values?.[0] || innerType._def?.value
                  : null;

                const optionalMarker = isOptional ? " (optional)" : "";
                return `    - ${key}: ${
                  isLiteral
                    ? `literal ("${literalValue}")`
                    : isEnum
                    ? `enum (${enumOptions.join(" | ")})`
                    : typeName
                }${optionalMarker}${description ? ` - ${description}` : ""}${
                  defaultValue !== undefined
                    ? ` [default: ${defaultValue}]`
                    : ""
                }`;
              }
            );

            if (fields.length > 0) {
              argsDescription = `Arguments:\n${fields.join("\n")}`;
            }
          } else {
            console.warn(
              `No shape found for schema of action ${action.id}`,
              schema
            );
          }
        }
      } catch (e) {
        console.error(`Error generating args description for ${action.id}:`, e);
        argsDescription = "Arguments: (error loading schema)";
      }
    }

    descriptions.push(`  - ${action.id}: ${action.name}\n${argsDescription}`);
  }

  return descriptions.join("\n\n") || "No actions available";
}

export const actionAIPrompt: Plugin<AIEditPrompt> = {
  id: "action-ai-prompt",
  name: "Action-Based Editor",
  type: "patchwork:ai-prompt",
  datatypeId: "*", // Works on all datatypes
  module: {
    docToText: (doc: any) => {
      // Get cached action descriptions for this datatype
      const dataTypeId = doc?.["@patchwork"]?.type || "*";

      // Trigger async loading if not already loaded (fire and forget)
      if (!loadedDatatypes.has(dataTypeId)) {
        ensurePluginsLoaded(dataTypeId);
      }

      const actionDescriptions =
        actionDescriptionsByDatatype.get(dataTypeId) || [];

      console.log(
        "actionDescriptions for datatype",
        dataTypeId,
        actionDescriptions
      );

      // Use synchronous version with cached plugins
      const actionsText = getAvailableActionsForDocSync(
        doc,
        actionDescriptions
      );

      return `## Current Document State

${JSON.stringify(doc, null, 2)}

## Available Actions

${actionsText}`;
    },
    textToDoc: (text: string) => {
      // Not used - we execute actions instead
      try {
        return JSON.parse(text);
      } catch {
        return {};
      }
    },
    prompt: `
You are an AI assistant helping to edit documents by invoking actions on them.

When the user asks for changes, follow these steps:
1. Review the available actions listed below and their arguments
2. Determine which action(s) would accomplish the user's goal
3. Return your response in the following format:

---
[Brief explanation of what you're doing]

<edit>
[
  {
    "actionId": "action-id-here",
    "args": {
      "argName": "value"
    }
  }
]
</edit>
---

IMPORTANT:
- You MUST wrap your action commands in <edit> tags for them to be executed!
- Inside the <edit> tags, put a JSON array of action commands
- The JSON array should be valid JSON
- Only use actions that are listed as available
- Make sure argument values match the expected types (number, string, boolean, enum)
- You can invoke multiple actions in sequence by including multiple action objects in the array
- For enum types, only use the specific values shown in parentheses

Example:
<edit>
[
  {
    "actionId": "counter-increment",
    "args": {
      "step": 5
    }
  },
  {
    "actionId": "counter-increment",
    "args": {
      "step": 3
    }
  }
]
</edit>

The available actions and their current argument schemas are included in the document context above.

Remember: Only use actions from the "Available Actions" list. Make sure to provide the correct argument types as specified.
`,
    edit: async (
      handle: DocHandle<any>,
      newContent: { content: any },
      context?: { actions?: any[]; repo?: any }
    ) => {
      console.log("=== AI Edit function called ===");
      console.log("newContent:", newContent);
      console.log("context:", context);

      const actionCommands: any = newContent;

      // Get available actions for validation
      const doc = handle.doc();
      const dataTypeId = doc?.["@patchwork"]?.type || "*";
      const registry = getRegistry("patchwork:action");
      const allActions = registry.all();

      // Filter actions that match the datatype
      const matchingActions = allActions.filter((action: any) => {
        const supportedDataTypes = action.supportedDataTypes;
        if (!supportedDataTypes) return false;
        if (supportedDataTypes === "*") return true;
        if (Array.isArray(supportedDataTypes)) {
          return supportedDataTypes.includes(dataTypeId) || supportedDataTypes.includes("*");
        }
        return supportedDataTypes === dataTypeId;
      });

      const availableActionIds = new Set(matchingActions.map((a: any) => a.id));

      console.log(
        `Found ${matchingActions.length} actions for datatype ${dataTypeId}:`,
        matchingActions.map((a: any) => a.id)
      );

      // Execute each action
      for (const command of actionCommands) {
        console.log(`Executing action: ${command.actionId}`, command.args);

        if (!availableActionIds.has(command.actionId)) {
          throw new Error(
            `Action "${command.actionId}" is not available for this document`
          );
        }

        const plugin = await registry.load(command.actionId);

        if (!plugin) {
          throw new Error(`Failed to load action plugin: ${command.actionId}`);
        }

        if (plugin.module.argsSchema) {
          // Validate args with schema
          const schema = plugin.module.argsSchema(handle.docSync());
          const validatedArgs = schema.parse(command.args || {});
          console.log("Validated args:", validatedArgs);
          plugin.module.default(handle, context.repo, validatedArgs);
        } else {
          plugin.module.default(handle, context.repo);
        }
      }
    },
  },
};
