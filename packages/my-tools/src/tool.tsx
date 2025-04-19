import { useDocument } from "@automerge/automerge-repo-react-hooks";
import {
  type ModuleSettingsDoc,
  EditorProps,
  type DataType,
  type Tool,
  makeTool,
  importModuleFromFolderDocUrl,
  ImportMethod,
  ExportMethod,
  isPlugin,
  type DataTypeDescription,
  type ToolDescription,
  type Plugin,
} from "@patchwork/sdk";

import React, { useCallback, useState, useEffect } from "react";
import { RegisterModuleDialog } from "./components/RegisterModuleDialog";
import { RegisteredModules } from "./components/RegisteredModules";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";

export type ModuleContents = {
  url: string;
  dataTypes?: DataType[];
  tools?: Tool[];
  importMethods?: ImportMethod[];
  exportMethods?: ExportMethod[];
  error?: string;
};

export const ModuleSettingsEditor: React.FC<
  EditorProps<ModuleSettingsDoc, string>
> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<ModuleSettingsDoc>(docUrl);
  const [registeredModules, setRegisteredModules] = useState<ModuleContents[]>(
    []
  );

  const loadModuleContents = async (
    url: AutomergeUrl
  ): Promise<ModuleContents> => {
    try {
      const module = isValidAutomergeUrl(url)
        ? await importModuleFromFolderDocUrl(url)
        : import(url);

      const plugins = Object.values(module).flatMap((value) => {
        if (isPlugin(value)) {
          return [value];
        }
        if (Array.isArray(value)) {
          return (value as Plugin[]).filter((v): v is Plugin => isPlugin(v));
        }
        return [];
      });

      // We keep the structure here (at least for now) so that we can
      // organize the display in the UI.
      return {
        url,
        dataTypes: plugins.filter((p): p is Plugin<DataTypeDescription> =>
          isPlugin(p, "patchwork:dataType")
        ),
        tools: plugins.filter((p): p is Plugin<ToolDescription> =>
          isPlugin(p, "patchwork:tool")
        ),
        importMethods: plugins.filter((p): p is Plugin<ImportMethod> =>
          isPlugin(p, "patchwork:importMethod")
        ),
        exportMethods: plugins.filter((p): p is Plugin<ExportMethod> =>
          isPlugin(p, "patchwork:exportMethod")
        ),
      };
    } catch (err) {
      return {
        url,
        error: "Failed to load module. Please check the URL and try again.",
      };
    }
  };

  // Load registered modules
  useEffect(() => {
    if (!doc?.modules) return;

    const loadModules = async () => {
      const moduleContents = await Promise.all(
        doc.modules.map(loadModuleContents)
      );
      setRegisteredModules(moduleContents);
    };

    loadModules();
  }, [doc?.modules]);

  const registerModule = useCallback(
    (moduleUrl: AutomergeUrl) => {
      if (!doc || !moduleUrl.trim()) return;

      changeDoc((doc) => {
        if (!doc.modules) doc.modules = [];
        if (!doc.modules.includes(moduleUrl)) {
          doc.modules.push(moduleUrl);
        }
      });
    },
    [doc, changeDoc]
  );

  const removeModule = useCallback(
    (urlToRemove: string) => {
      changeDoc((doc) => {
        if (!doc.modules) return;
        doc.modules = doc.modules.filter((url) => url !== urlToRemove);
      });
    },
    [changeDoc]
  );

  if (!doc) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <RegisterModuleDialog
          onRegister={registerModule}
          loadModuleContents={loadModuleContents}
        />
        <RegisteredModules
          registeredModules={registeredModules}
          removeModule={removeModule}
        />
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: ModuleSettingsEditor,
});
