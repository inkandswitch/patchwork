import { render } from "solid-js/web";
import type { ModuleSettingsDoc } from "@patchwork/filesystem";
import type { ToolImplementation } from "@patchwork/plugins";
import type { TinyPatchworkAccountDoc } from "tiny-patchwork/src/lib/account-doc.ts";
import style from "./style.css";
const sheet = Object.assign(document.createElement("style"), {
  textContent: style,
});
document.head.append(sheet);

export const plugins = [
  {
    id: "chee/sideboard",
    type: "patchwork:tool",
    name: "Sideboard",
    supportedDataTypes: ["folder"],
    icon: "FolderOpen",
    async load(): Promise<ToolImplementation<TinyPatchworkAccountDoc>> {
      const sideboard = await import("./sideboard.tsx");

      return (handle, element) => {
        return render(
          () => <sideboard.default handle={handle} repo={element.repo} />,
          element
        );
      };
    },
  },
  {
    id: "chee/module-settings",
    type: "patchwork:tool",
    name: "Module Settings",
    icon: "Settings",
    supportedDataTypes: ["patchwork:module-settings"],
    async load(): Promise<ToolImplementation<ModuleSettingsDoc>> {
      const modulesettings = await import("./module-settings.jsx");
      return function (handle, element) {
        return render(
          () => <modulesettings.default handle={handle} repo={element.repo} />,
          element
        );
      };
    },
  },
];
