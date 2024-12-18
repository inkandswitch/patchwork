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

export const RegisteredModules = ({
  registeredModules,
  removeModule,
}: {
  registeredModules: ModuleContents[];
  removeModule: (url: string) => void;
}) => (
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
);
