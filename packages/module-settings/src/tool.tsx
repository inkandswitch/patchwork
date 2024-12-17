import { useDocument } from "@automerge/automerge-repo-react-hooks";
import {
  type ModuleSettingsDoc,
  allDataTypes,
  allTools,
  EditorProps,
  makeTool,
  isTool,
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
import React, { useCallback, useState } from "react";

interface ModulePreview {
  dataType?: any;
  tools?: any[];
}

export const ModuleSettingsEditor: React.FC<
  EditorProps<ModuleSettingsDoc, string>
> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<ModuleSettingsDoc>(docUrl);
  const [moduleUrl, setModuleUrl] = useState("");
  const [preview, setPreview] = useState<ModulePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inspectModule = useCallback(async () => {
    try {
      setError(null);
      const module = await import(moduleUrl);
      setPreview({
        dataType: module.dataType,
        tools: module.tools?.filter(isTool) || [],
      });
    } catch (err) {
      setError("Failed to load module. Please check the URL and try again.");
      setPreview(null);
    }
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

  const modules = doc.modules || [];

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

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Module Contents:</h4>
                <ul className="space-y-2">
                  {preview.dataType && (
                    <li className="flex items-center gap-2">
                      <Icon type="Database" size={14} />
                      <span>DataType Available</span>
                    </li>
                  )}
                  {preview.tools?.map((tool, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icon type="Wrench" size={14} />
                      <span>{tool.name || tool.id}</span>
                    </li>
                  ))}
                </ul>
              </div>

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
          <div className="space-y-2">
            {modules.map((url, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <Icon type="Package" size={14} />
                  <span className="text-sm text-gray-500">{url}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeModule(url)}
                  className="text-red-500"
                >
                  <Icon type="Trash" size={14} />
                </Button>
              </div>
            ))}
            {modules.length === 0 && (
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
  type: "patchwork:tool",
  id: "module-settings",
  name: "Module Settings",
  supportedDataTypes: ["module-settings"],
  EditorComponent: ModuleSettingsEditor,
});
