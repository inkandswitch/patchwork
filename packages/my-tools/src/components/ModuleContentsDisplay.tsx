import { Alert, AlertTitle, AlertDescription } from "@patchwork/sdk/ui";
import { ModuleContents } from "../tool";
import { DataTypesModule } from "./DataTypesModule";
import { ToolsModule } from "./ToolsModule";
import { ImportMethod } from "./ImportMethod";
import { ExportMethod } from "./ExportMethod";

// Component to display module contents consistently
export const ModuleContentsDisplay: React.FC<{ contents: ModuleContents }> = ({
  contents,
}) => {
  const {
    dataTypes = [],
    tools = [],
    importMethods = [],
    exportMethods = [],
    error,
  } = contents;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading {contents.url}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {dataTypes.length > 0 && <DataTypesModule dataTypes={dataTypes} />}
      {importMethods.map((method, i) => (
        <ImportMethod key={`import-${i}`} method={method} />
      ))}
      {exportMethods.map((method, i) => (
        <ExportMethod key={`export-${i}`} method={method} />
      ))}
      {tools.length > 0 && <ToolsModule tools={tools} />}
      {!dataTypes.length &&
        !tools.length &&
        !importMethods.length &&
        !exportMethods.length && (
          <div className="text-gray-500 italic">
            No datatypes, import/export methods, or tools found
          </div>
        )}
    </div>
  );
};
