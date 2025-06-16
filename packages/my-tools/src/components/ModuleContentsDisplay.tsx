import { Alert, AlertTitle, AlertDescription } from "@patchwork/sdk/ui";
import { ModuleContents } from "../tool";
import { DataTypesModule } from "./DataTypesModule";
import { ToolsModule } from "./ToolsModule";
import {
  DataTypeDescription,
  ToolDescription,
  ImportMethod as ImportMethodType,
  ExportMethod as ExportMethodType,
} from "@patchwork/sdk";
import { ImportMethod } from "./ImportMethod";
import { ExportMethod } from "./ExportMethod";
import { GenericPlugin } from "./GenericPlugin";

// Component to display module contents consistently
export const ModuleContentsDisplay: React.FC<{ contents: ModuleContents }> = ({
  contents,
}) => {
  const { plugins, error } = contents;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading {contents.url}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const dataTypes = plugins.filter(
    (plugin) => plugin.type === "patchwork:dataType"
  ) as DataTypeDescription[];
  const tools = plugins.filter(
    (plugin) => plugin.type === "patchwork:tool"
  ) as ToolDescription[];
  const importMethods = plugins.filter(
    (plugin) => plugin.type === "patchwork:importMethod"
  ) as ImportMethodType[];
  const exportMethods = plugins.filter(
    (plugin) => plugin.type === "patchwork:exportMethod"
  ) as ExportMethodType[];
  const otherPlugins = plugins.filter(
    (plugin) =>
      plugin.type !== "patchwork:dataType" &&
      plugin.type !== "patchwork:tool" &&
      plugin.type !== "patchwork:importMethod" &&
      plugin.type !== "patchwork:exportMethod"
  );

  return (
    <div className="space-y-2 text-sm">
      {plugins.length === 0 && (
        <div className="text-gray-500 italic">No plugins found</div>
      )}
      {dataTypes.length > 0 && <DataTypesModule dataTypes={dataTypes} />}
      {importMethods.map((method, i) => (
        <ImportMethod key={method.id} method={method} />
      ))}
      {exportMethods.map((method, i) => (
        <ExportMethod key={method.id} method={method} />
      ))}
      {tools.length > 0 && <ToolsModule tools={tools} />}
      {otherPlugins.length > 0 &&
        otherPlugins.map((plugin, i) => (
          <GenericPlugin key={plugin.id} plugin={plugin} />
        ))}
    </div>
  );
};
