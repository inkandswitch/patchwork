import { Alert, AlertTitle, AlertDescription } from "@patchwork/sdk/ui";
import { ModuleContents } from "../tool";
import { DataTypeModule } from "./DataTypeModule";
import { ToolsModule } from "./ToolsModule";

// Component to display module contents consistently
export const ModuleContentsDisplay: React.FC<{ contents: ModuleContents }> = ({
  contents,
}) => {
  const { dataType, tools = [], error } = contents;

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
      {dataType && <DataTypeModule dataType={dataType} />}
      {tools.length > 0 && <ToolsModule tools={tools} />}
      {!dataType && !tools.length && (
        <div className="text-gray-500 italic">No datatypes or tools found</div>
      )}
    </div>
  );
};
