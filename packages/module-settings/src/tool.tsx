import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import {
  type ModuleSettingsDoc,
  allDataTypes,
  allTools,
  EditorProps,
  makeTool,
  Tool,
} from "@patchwork/sdk";
import { Icon, Input, Label } from "@patchwork/sdk/ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export const ModuleSettingsEditor: React.FC<
  EditorProps<ModuleSettingsDoc, string>
> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<ModuleSettingsDoc>(docUrl);

  const considerUpdatingDatatype = useCallback((id: string, value: string) => {
    console.log("Changing datatype module", id, value);
    import(value).then((module) => {
      console.log("Proposed datatype module", module);
      if (!module?.dataType) {
        console.error("No dataType exported from module", value);
      }
      changeDoc((doc) => {
        doc.dataTypeModules[id] = value;
      });
    });
  }, []);

  const considerUpdatingTool = useCallback((id: string, value: string) => {
    console.log("Changing tool module", id, value);
    import(value).then((module) => {
      if (!module?.tool) {
        console.error("No tool exported from module", value);
      }
      changeDoc((doc) => {
        doc.toolModules[id] = value;
      });
    });
  }, []);

  const considerAddingTool = useCallback((value: string) => {
    console.log("Adding tool module", value);
    import(value).then((module) => {
      if (!module?.tool) {
        console.error("No tool exported from module", value);
      }
      const id = module.tool.id; // TODO: only supports a single tool
      changeDoc((doc) => {
        doc.toolModules[id] = value;
      });
    });
  }, []);

  const removeTool = useCallback((id: string) => {
    console.log("Removing tool module", id);
    changeDoc((doc) => {
      delete doc.toolModules[id];
    });
  }, []);

  if (!doc) {
    return null;
  }

  const dataTypes = allDataTypes();
  const dataTypeModules = doc.dataTypeModules;

  const tools = allTools();
  const toolModules = doc.toolModules;

  console.log({ doc, tools, toolModules });

  return (
    <div>
      <div className="grid w-full overflow-scroll h-full items-center gap-1.5 pt-2 p-4">
        <Label>Tools</Label>
        <div className="flex flex-col gap-2 py-2">
          {Object.entries(tools).map(([id, tool]) => {
            return (
              <div className="flex items-center gap-2" key={id}>
                <label
                  htmlFor={`tool-${id}`}
                  className="text-sm text-gray-600 w-64"
                >
                  <Icon
                    type={"Cog"}
                    size={14}
                    className="inline-block font-bold mr-2 align-top mt-[2px]"
                  />
                  {id}
                </label>
                <Label key={tool.id} />

                <Input
                  id={`tool-${tool.id}`}
                  value={toolModules[tool.id]}
                  defaultValue={"Built-In (paste valid URL to replace)"}
                  onChange={(evt) => considerUpdatingTool(id, evt.target.value)}
                />
                <button onClick={() => removeTool(id)} className="text-red-500">
                  <Icon type={"Trash"} size={14} />
                </button>
              </div>
            );
          })}
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
            <label htmlFor={`add-tool`} className="text-sm text-gray-600 w-64">
              <Icon
                type={"Plus"}
                size={14}
                className="inline-block font-bold mr-2 align-top mt-[2px]"
              />
              Add Tool
            </label>
            <Input
              id="name"
              placeholder={"Paste valid URL to add tool"}
              onChange={(evt) => considerAddingTool(evt.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const tool = makeTool({
  type: "patchwork:tool",
  id: "module-settings",
  name: "Module Settings",
  supportedDataTypes: ["module-settings"],
  EditorComponent: ModuleSettingsEditor,
});
