import { render } from "solid-js/web";
import type { ModuleSettingsDoc } from "@inkandswitch/patchwork-filesystem";
import { type ToolImplementation } from "@inkandswitch/patchwork-plugins";

export const plugins = [
  {
    id: "module-settings-manager",
    type: "patchwork:tool",
    name: "Module Settings Manager",
    icon: "Settings",
    supportedDatatypes: ["patchwork:module-settings", "my-tools"],
    async load(): Promise<ToolImplementation<ModuleSettingsDoc>> {
      const { ModuleSettings } =
        await import("./module-settings/module-settings.tsx");
      return function (handle, element) {
        return render(
          () => (
            <ModuleSettings
              handle={handle}
              repo={element.repo}
              element={element as any}
            />
          ),
          element
        );
      };
    },
  },
];
