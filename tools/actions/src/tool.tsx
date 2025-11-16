import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { getRegistry } from "@patchwork/plugins";
import { ReactToolProps } from "@patchwork/react";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { cacheActionPlugin, cacheActionDescriptions } from "./aiPrompt";

export const Tool: React.FC<ReactToolProps> = ({ docUrl }) => {
  const handle = useDocHandle<any>(docUrl, { suspense: true });
  const [doc] = useDocument<any>(docUrl, { suspense: true });

  const dataTypeId: string = handle.doc()["@patchwork"]?.type || "*";
  const repo = useRepo();

  console.log("dataTypeId", dataTypeId);

  // Get matching action plugins
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    const registry = getRegistry("patchwork:action");
    const allActions = registry.all();

    // Filter actions that match the datatype
    const matchingActions = allActions.filter((action: any) => {
      const supportedDataTypes = action.supportedDataTypes;
      if (!supportedDataTypes) return false;
      if (supportedDataTypes === "*") return true;
      if (Array.isArray(supportedDataTypes)) {
        return (
          supportedDataTypes.includes(dataTypeId) ||
          supportedDataTypes.includes("*")
        );
      }
      return supportedDataTypes === dataTypeId;
    });

    setActions(matchingActions);

    // Listen for registry changes
    const unsubscribe = registry.on("changed", () => {
      const updatedActions = registry.all();
      const updatedMatching = updatedActions.filter((action: any) => {
        const supportedDataTypes = action.supportedDataTypes;
        if (!supportedDataTypes) return false;
        if (supportedDataTypes === "*") return true;
        if (Array.isArray(supportedDataTypes)) {
          return (
            supportedDataTypes.includes(dataTypeId) ||
            supportedDataTypes.includes("*")
          );
        }
        return supportedDataTypes === dataTypeId;
      });
      setActions(updatedMatching);
    });

    return unsubscribe;
  }, [dataTypeId]);

  // Cache action descriptions for AI prompt
  React.useEffect(() => {
    cacheActionDescriptions(dataTypeId, actions);
  }, [dataTypeId, actions]);

  const [actionArgs, setActionArgs] = useState<
    Record<string, Record<string, any>>
  >({});
  const [applicableActions, setApplicableActions] = useState<Set<string>>(
    new Set()
  );
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (pluginId: string, args?: Record<string, any>) => {
    try {
      setError(null);
      const registry = getRegistry("patchwork:action");
      const plugin = await registry.load(pluginId);

      if (!plugin) {
        throw new Error(`Failed to load action plugin: ${pluginId}`);
      }

      if (plugin.module.argsSchema) {
        // argsSchema is a function that takes doc
        const schema = plugin.module.argsSchema(doc);

        // Validate args with Zod schema
        const validatedArgs = schema.parse(args);
        plugin.module.default(handle, repo, validatedArgs);
      } else {
        plugin.module.default(handle, repo);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(
          err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  // Initialize default values for all actions with schemas
  React.useEffect(() => {
    const initDefaults = async () => {
      const registry = getRegistry("patchwork:action");
      const defaults: Record<string, Record<string, any>> = {};
      for (const action of actions) {
        const plugin = await registry.load(action.id);
        if (plugin && plugin.module.argsSchema) {
          const schema = plugin.module.argsSchema(doc);
          const shape = schema.shape;
          console.log(action.id, " shape ", shape);
          const actionDefaults: Record<string, any> = {};
          for (const [key, value] of Object.entries(shape)) {
            const def = (value as any)._def;
            if (def.defaultValue !== undefined) {
              actionDefaults[key] = def.defaultValue;
            }
          }
          defaults[action.id] = actionDefaults;
        }
      }
      setActionArgs(defaults);
    };
    initDefaults();
  }, [actions, doc]);

  // Determine which actions are applicable given the state of the doc
  React.useEffect(() => {
    const updateApplicableActions = async () => {
      const registry = getRegistry("patchwork:action");
      const applicable = new Set<string>();
      for (const action of actions) {
        const plugin = await registry.load(action.id);
        if (
          plugin &&
          (!plugin.module.isApplicable ||
            plugin.module.isApplicable(doc, handle))
        ) {
          applicable.add(action.id);
        }
      }
      setApplicableActions(applicable);
    };
    updateApplicableActions();
  }, [actions, doc, handle]);

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-2 max-h-96">
        {actions.map((action) =>
          applicableActions.has(action.id) ? (
            <ActionButton
              key={action.id}
              pluginId={action.id}
              name={action.name}
              doc={doc}
              args={actionArgs[action.id] ?? {}}
              isExpanded={expandedAction === action.id}
              onToggleExpand={() =>
                setExpandedAction(
                  expandedAction === action.id ? null : action.id
                )
              }
              onArgsChange={(args) =>
                setActionArgs({ ...actionArgs, [action.id]: args })
              }
              onSubmit={(args) => handleAction(action.id, args)}
            />
          ) : null
        )}
      </div>

      <div className="border-t pt-4 flex-1 overflow-auto">
        <patchwork-view doc-url={docUrl} />
      </div>
    </div>
  );
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "doc-url": string;
        "tool-id"?: string | null;
        class?: string;
      };
    }
  }
}

const ActionButton: React.FC<{
  pluginId: string;
  name: string;
  doc: any;
  args: Record<string, any>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onArgsChange: (args: Record<string, any>) => void;
  onSubmit: (args: Record<string, any>) => void;
}> = ({
  pluginId,
  name,
  doc,
  args,
  isExpanded,
  onToggleExpand,
  onArgsChange,
  onSubmit,
}) => {
  const [plugin, setPlugin] = useState<any>(null);

  React.useEffect(() => {
    const registry = getRegistry("patchwork:action");
    registry.load(pluginId).then((plugin) => {
      if (plugin) {
        setPlugin(plugin);
        // Cache plugin for AI prompt
        cacheActionPlugin(pluginId, plugin);
      }
    });
  }, [pluginId]);

  if (!plugin?.module.argsSchema) {
    // No args, just a button in a card (always compact)
    return (
      <div className="border rounded p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{name}</h3>
          <button
            onClick={() => onSubmit({})}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Execute
          </button>
        </div>
      </div>
    );
  }

  const schema = plugin.module.argsSchema(doc);

  console.log(`[${pluginId}] Raw schema:`, {
    schema,
    _def: schema._def,
    typeName: schema._def?.typeName,
    constructor: schema.constructor?.name,
  });

  // Check if this is a discriminated union (Zod 4 style)
  const isDiscriminatedUnion =
    (schema.constructor?.name === "ZodDiscriminatedUnion" ||
      (schema._def?.type === "union" && schema._def?.discriminator)) ??
    false;
  const discriminator = isDiscriminatedUnion
    ? schema._def?.discriminator
    : null;

  let shape: any;
  let allFields: [string, any][];

  if (isDiscriminatedUnion && discriminator) {
    // For discriminated unions, we need to get the options and find the matching schema
    const options = schema._def?.options || schema.options || [];
    const discriminatorValue = args[discriminator];

    console.log(`[${pluginId}] Discriminated union:`, {
      discriminator,
      discriminatorValue,
      optionCount: options.length,
      sampleOption: options[0],
    });

    // Collect all possible discriminator values
    // In Zod 4, each option has .def.shape (not .shape directly)
    const discriminatorValues = options
      .map((opt: any) => {
        const optShape = opt.def?.shape || opt.shape;
        const discField = optShape?.[discriminator];
        // Literal values are in .def.values[0]
        return discField?.def?.values?.[0] || discField?._def?.value;
      })
      .filter(Boolean);

    console.log(`[${pluginId}] Discriminator values:`, discriminatorValues);

    // If no discriminator value is set, initialize with first option
    if (!discriminatorValue && discriminatorValues.length > 0) {
      onArgsChange({ ...args, [discriminator]: discriminatorValues[0] });
      return null; // Will re-render with the value set
    }

    // Find the matching option schema based on current discriminator value
    let activeSchema = null;
    if (discriminatorValue) {
      activeSchema = options.find((opt: any) => {
        const optShape = opt.def?.shape || opt.shape;
        const discField = optShape?.[discriminator];
        const literalValue =
          discField?.def?.values?.[0] || discField?._def?.value;
        return literalValue === discriminatorValue;
      });
    }

    // If we have an active schema, use its shape
    if (activeSchema) {
      shape = activeSchema.def?.shape || activeSchema.shape;
      // Filter out the discriminator field since it's shown in the top-level selector
      allFields = Object.entries(shape || {}).filter(
        ([key]) => key !== discriminator
      );
    } else {
      // Fallback if no matching schema (shouldn't happen after initialization)
      shape = {};
      allFields = [];
    }
  } else {
    // Regular schema - in Zod 4, shape is at .def.shape
    shape = (schema as any).shape || schema.def?.shape || schema._def?.shape;
    allFields = Object.entries(shape || {});

    // Check if there are any literal fields that need default values
    for (const [key, value] of allFields) {
      let innerType = value;
      while (
        innerType.def?.innerType ||
        innerType.def?.schema ||
        innerType._def?.innerType ||
        innerType._def?.schema
      ) {
        innerType =
          innerType.def?.innerType ||
          innerType.def?.schema ||
          innerType._def?.innerType ||
          innerType._def?.schema;
      }

      const isLiteral =
        innerType.def?.type === "literal" ||
        innerType._def?.typeName === "ZodLiteral";
      if (isLiteral && !args[key]) {
        const literalValue =
          innerType.def?.values?.[0] || innerType._def?.value;
        if (literalValue !== undefined) {
          onArgsChange({ ...args, [key]: literalValue });
          return null; // Will re-render with the value set
        }
      }
    }
  }

  console.log(`[${pluginId}] Schema:`, {
    isDiscriminatedUnion,
    discriminator,
    currentValue: discriminator ? args[discriminator] : null,
    fieldCount: allFields.length,
  });

  const fields = allFields;

  return (
    <div className="border rounded">
      {/* Compact header - always visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{isExpanded ? "▼" : "▶"}</span>
          <h3 className="font-medium text-sm">{name}</h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSubmit(args);
          }}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Execute
        </button>
      </div>

      {/* Expandable form fields */}
      {isExpanded && (
        <div className="border-t p-4 space-y-3">
          {/* Show discriminator selector for discriminated unions */}
          {isDiscriminatedUnion && discriminator && (
            <div className="space-y-1 pb-2 border-b">
              <label className="block font-medium">{discriminator}</label>
              <select
                value={args[discriminator] || ""}
                onChange={(e) => {
                  // Reset all args except the discriminator when switching
                  onArgsChange({ [discriminator]: e.target.value });
                }}
                className="w-full border rounded px-3 py-2"
              >
                {(() => {
                  const options = schema._def?.options || schema.options || [];
                  const discriminatorValues = options
                    .map((opt: any) => {
                      const optShape = opt.def?.shape || opt.shape;
                      const discField = optShape?.[discriminator];
                      return (
                        discField?.def?.values?.[0] || discField?._def?.value
                      );
                    })
                    .filter(Boolean);

                  return discriminatorValues.map((value: string) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ));
                })()}
              </select>
            </div>
          )}

          {fields.map(([key, zodType]: [string, any]) => {
            // Unwrap ZodDefault, ZodOptional, ZodEffects, etc. to get to the base type
            // In Zod 4, use .def.innerType and .def.schema
            let innerType = zodType;
            while (
              innerType.def?.innerType ||
              innerType.def?.schema ||
              innerType._def?.innerType ||
              innerType._def?.schema
            ) {
              innerType =
                innerType.def?.innerType ||
                innerType.def?.schema ||
                innerType._def?.innerType ||
                innerType._def?.schema;
            }

            const typeName =
              innerType.type || innerType.def?.type || innerType._def?.typeName;
            const description = zodType.description || innerType.description;

            // Handle z.literal
            const isLiteral =
              innerType.def?.type === "literal" ||
              innerType._def?.typeName === "ZodLiteral";

            console.log(`[${pluginId}] Field ${key}:`, {
              typeName,
              isLiteral,
              innerType: innerType._def?.typeName,
              hasOptions: !!(innerType as any).options,
              hasEnum: !!(innerType as any).enum,
              hasDefValues: !!innerType._def?.values,
            });

            return (
              <div key={key} className="space-y-1">
                <label className="block font-medium">
                  {key}
                  {description && (
                    <span className="text-sm text-gray-600 ml-2">
                      ({description})
                    </span>
                  )}
                </label>

                {(() => {
                  // Handle z.literal - show as read-only
                  if (isLiteral) {
                    const literalValue =
                      innerType.def?.values?.[0] || innerType._def?.value;
                    return (
                      <input
                        type="text"
                        value={literalValue}
                        disabled
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                      />
                    );
                  }

                  // For Zod 4, check options, enum, def.entries, or _def.values
                  const enumOptions =
                    (innerType as any).options ||
                    (innerType as any).enum ||
                    (innerType.def?.entries
                      ? Object.keys(innerType.def.entries)
                      : null) ||
                    innerType._def?.values;

                  console.log(
                    `[${pluginId}] Field ${key} enumOptions:`,
                    enumOptions
                  );

                  return enumOptions && Array.isArray(enumOptions) ? (
                    <select
                      value={args[key] ?? ""}
                      onChange={(e) =>
                        onArgsChange({ ...args, [key]: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select...</option>
                      {enumOptions.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : typeName === "number" ? (
                    <input
                      type="number"
                      value={args[key] ?? ""}
                      onChange={(e) =>
                        onArgsChange({ ...args, [key]: Number(e.target.value) })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : typeName === "string" ? (
                    <input
                      type="text"
                      value={args[key] ?? ""}
                      onChange={(e) =>
                        onArgsChange({ ...args, [key]: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  ) : typeName === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={args[key] ?? false}
                      onChange={(e) =>
                        onArgsChange({ ...args, [key]: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  ) : (
                    <div className="text-gray-500">
                      Unsupported type: {typeName}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
