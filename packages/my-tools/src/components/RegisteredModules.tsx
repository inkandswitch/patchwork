import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Icon,
  Button,
} from "@patchwork/sdk/ui";
import { ModuleContentsDisplay } from "./ModuleContentsDisplay";
import { ModuleContents } from "../tool";
import { selectDocLink } from "@patchwork/sdk/router";
import { dataTypeById, toolsForDataType } from "@patchwork/sdk";
import { DocPathUtils } from "@patchwork/folder";
import { AutomergeUrl } from "@automerge/automerge-repo";

// New ModuleCard component with enhanced functionality
interface ModuleCardProps {
  module: ModuleContents;
  onRemove: (url: AutomergeUrl) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onRemove }) => {
  // Create a doc link from the module URL
  const docLink = {
    type: "folder", // assuming modules are stored in folders
    url: module.url,
    name: module.dataType?.name || "Unnamed Module", // helper function to get readable name
  };

  // Look up the data type and tool info
  const dataType = dataTypeById(docLink.type);
  const tool = toolsForDataType(docLink.type)[0];
  const icon = tool?.icon ?? dataType?.icon ?? "Package";

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon type={icon} size={14} />
          <span className="font-medium">{docLink.name}</span>
          <span className="text-sm text-gray-500">{module.url}</span>
          <button
            className="text-sm text-gray-500 underline align-bottom cursor-pointer"
            onClick={() => {
              selectDocLink(docLink);
            }}
          >
            Open
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(module.url)}
          className="text-red-500"
        >
          <Icon type="Trash" size={14} />
        </Button>
      </div>
      <ModuleContentsDisplay contents={module} />
    </div>
  );
};

// Helper function to get a readable name from the module
function getModuleName(module: ModuleContents): string {
  // Try to extract a meaningful name from the URL
  // You might want to customize this based on your URL structure
  const urlParts = module.url.split("/");
  const lastPart = urlParts[urlParts.length - 1];

  // Remove file extension if present
  const name = lastPart.replace(/\.[^/.]+$/, "");

  // Capitalize and add spaces before capital letters
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Updated RegisteredModules component
interface RegisteredModulesProps {
  registeredModules: ModuleContents[];
  removeModule: (url: string) => void;
}

export const RegisteredModules: React.FC<RegisteredModulesProps> = ({
  registeredModules,
  removeModule,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Registered Modules</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {registeredModules.map((module, index) => (
          <ModuleCard key={index} module={module} onRemove={removeModule} />
        ))}
        {registeredModules.length === 0 && (
          <div className="text-gray-500 text-center py-4">
            No modules registered yet
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
