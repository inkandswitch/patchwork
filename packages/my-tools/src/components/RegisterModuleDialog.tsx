import {
  Dialog,
  DialogTrigger,
  Button,
  Icon,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
} from "@patchwork/sdk/ui";
import { useState, useCallback } from "react";
import { ModuleContents } from "../tool";
import { ModuleContentsDisplay } from "./ModuleContentsDisplay";
import { importModuleFromFolderDocUrl } from "@patchwork/sdk";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";

export const RegisterModuleDialog: React.FC<{
  onRegister: (url: AutomergeUrl) => void;
  loadModuleContents: (url: AutomergeUrl) => Promise<ModuleContents>;
}> = ({ onRegister, loadModuleContents }) => {
  const [moduleUrl, setModuleUrl] = useState("");
  const [preview, setPreview] = useState<ModuleContents | null>(null);
  const [open, setOpen] = useState(false);

  const inspectModule = useCallback(async () => {
    if (!moduleUrl.trim()) return;
    if (isValidAutomergeUrl(moduleUrl)) {
      const contents = await importModuleFromFolderDocUrl(moduleUrl);
      setPreview(contents);
    }
  }, [moduleUrl, loadModuleContents]);

  const handleRegister = useCallback(() => {
    if (!moduleUrl.trim()) return;
    onRegister(moduleUrl as AutomergeUrl);
    setModuleUrl("");
    setPreview(null);
    setOpen(false);
  }, [moduleUrl, onRegister]);

  const handleBack = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setPreview(null);
          setModuleUrl("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">
          <Icon type="Plus" className="mr-2" />
          Register New Module
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Module</DialogTitle>
        </DialogHeader>

        {!preview ? (
          // Step 1: URL Input
          <div className="space-y-4 p-4">
            <div>
              <Label htmlFor="moduleUrl">Module URL</Label>
              <div className="flex gap-2">
                <Input
                  id="moduleUrl"
                  value={moduleUrl}
                  onChange={(e) => setModuleUrl(e.target.value)}
                  placeholder="automerge:2oQBaw48pr5B5VUCiThMQBwM8ApG"
                />
                <Button onClick={inspectModule} disabled={!moduleUrl.trim()}>
                  Inspect
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-4">
              <p>
                Tools and datatypes are loaded from folders. Paste in an
                AutomergeURL for the folder which contains the package.json. The
                inspector will show you which datatypes & tools it finds within.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p>
                  Use this format:
                  <code className="block mt-2 bg-white p-2 rounded">
                    automerge:2oQBaw48pr5B5VUCiThMQBwM8ApG
                  </code>
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Preview & Confirmation
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">
                Loading module from:
              </div>
              <code className="text-sm break-all">{moduleUrl}</code>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Module Contents:</h4>
              <ModuleContentsDisplay contents={preview} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack}>
                <Icon type="ArrowLeft" className="mr-2" size={16} />
                Back
              </Button>
              <Button onClick={handleRegister} className="flex-1">
                Confirm Registration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
