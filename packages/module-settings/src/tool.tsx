import { useDocument } from "@automerge/automerge-repo-react-hooks";
import {
  type ModuleSettingsDoc,
  allDataTypes,
  allTools,
  EditorProps,
  makeTool,
  isTool,
  type DataType,
  type Tool,
} from "@patchwork/sdk";
import {
  Icon,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@patchwork/sdk/ui";
import React, { useCallback, useState, useEffect } from "react";

interface ModuleContents {
  url: string;
  dataType?: DataType<unknown, unknown, unknown>;
  tools?: Tool[];
  error?: string;
}

// Component to display module contents consistently
const ModuleContentsDisplay: React.FC<{ contents: ModuleContents }> = ({
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
      {dataType && (
        <div className="border rounded p-3">
          <div className="flex items-center gap-2 font-medium mb-2">
            <Icon type="Database" size={14} />
            <span>DataType: {dataType.name}</span>
          </div>
          <div className="pl-6 text-gray-500">
            {dataType.unixFileExtensions &&
              dataType.unixFileExtensions?.length > 0 && (
                <div>File types: {dataType.unixFileExtensions.join(", ")}</div>
              )}
          </div>
        </div>
      )}
      {tools.length > 0 && (
        <div className="border rounded p-3">
          <div className="flex items-center gap-2 font-medium mb-2">
            <Icon type="Wrench" size={14} />
            <span>Tools</span>
          </div>
          <ul className="pl-6 space-y-1">
            {tools.map((tool, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-500">
                <Icon type={tool.icon || "Wrench"} size={12} />
                <span>{tool.name}</span>
                {tool.supportedDataTypes && (
                  <span className="text-xs">
                    (supports:{" "}
                    {Array.isArray(tool.supportedDataTypes)
                      ? tool.supportedDataTypes.join(", ")
                      : "*"}
                    )
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!dataType && !tools.length && (
        <div className="text-gray-500 italic">No datatypes or tools found</div>
      )}
    </div>
  );
};

export const ModuleSettingsEditor: React.FC<
  EditorProps<ModuleSettingsDoc, string>
> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<ModuleSettingsDoc>(docUrl);
  const [moduleUrl, setModuleUrl] = useState("");
  const [preview, setPreview] = useState<ModuleContents | null>(null);
  const [registeredModules, setRegisteredModules] = useState<ModuleContents[]>(
    []
  );

  const loadModuleContents = async (url: string): Promise<ModuleContents> => {
    try {
      const module = await import(url);
      return {
        url,
        dataType: module.dataType,
        tools: module.tools?.filter(isTool) || [],
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

  const inspectModule = useCallback(async () => {
    if (!moduleUrl.trim()) return;
    const contents = await loadModuleContents(moduleUrl);
    setPreview(contents);
  }, [moduleUrl]);

  const registerModule = useCallback(() => {
    if (!doc || !moduleUrl.trim()) return;

    changeDoc((doc) => {
      if (!doc.modules) doc.modules = [];
      if (!doc.modules.includes(moduleUrl)) {
        doc.modules.push(moduleUrl);
      }
    });

    setModuleUrl("");
    setPreview(null);
  }, [doc, moduleUrl]);

  const removeModule = useCallback((urlToRemove: string) => {
    changeDoc((doc) => {
      if (!doc.modules) return;
      doc.modules = doc.modules.filter((url) => url !== urlToRemove);
    });
  }, []);

  if (!doc) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Module Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import New Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="moduleUrl">Module URL</Label>
            <div className="flex gap-2">
              <Input
                id="moduleUrl"
                value={moduleUrl}
                onChange={(e) => setModuleUrl(e.target.value)}
                placeholder="Enter module URL"
              />
              <Button onClick={inspectModule} disabled={!moduleUrl.trim()}>
                Inspect
              </Button>
            </div>
          </div>

          {preview && (
            <div className="space-y-4">
              <ModuleContentsDisplay contents={preview} />
              <Button onClick={registerModule} disabled={!moduleUrl.trim()}>
                Register Module
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registered Modules Section */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registeredModules.map((module, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon type="Package" size={14} />
                    <span className="text-sm text-gray-500">{module.url}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeModule(module.url)}
                    className="text-red-500"
                  >
                    <Icon type="Trash" size={14} />
                  </Button>
                </div>
                <ModuleContentsDisplay contents={module} />
              </div>
            ))}
            {registeredModules.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                No modules registered yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: ModuleSettingsEditor,
});
