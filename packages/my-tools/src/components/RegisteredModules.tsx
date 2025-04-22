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
import {
  getMatchingPlugins,
  getPluginFromRegistry,
  Tool,
  DataTypeDescription,
} from "@patchwork/sdk";
import { type DocLink } from "@patchwork/sdk/router";
import { AutomergeUrl } from "@automerge/automerge-repo";

interface ModuleCardProps {
  module: ModuleContents;
  onRemove: (url: AutomergeUrl) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onRemove }) => {
  const name = module.dataTypes?.length
    ? module.dataTypes[0].name
    : "Unnamed Module";

  // Create a doc link from the module URL
  const docLink = {
    type: "folder", // assuming modules are stored in folders
    url: module.url,
    name, // helper function to get readable name
  };

  // Look up the data type and tool info
  const dataTypeDesc = getPluginFromRegistry<DataTypeDescription>(
    "patchwork:dataType",
    docLink.type
  );
  const { plugins } = getMatchingPlugins<Tool>({
    pluginType: "patchwork:tool",
    matchField: "supportedDataTypes",
    matchValue: docLink.type,
  });
  const tool = plugins[0];
  const icon = tool?.icon ?? dataTypeDesc?.icon ?? "Package";

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
              selectDocLink(docLink as DocLink);
            }}
          >
            Open
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(module.url as AutomergeUrl)}
          className="text-red-500"
        >
          <Icon type="Trash" size={14} />
        </Button>
      </div>
      <ModuleContentsDisplay contents={module} />
    </div>
  );
};

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
