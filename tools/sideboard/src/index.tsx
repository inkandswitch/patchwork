import { render } from "solid-js/web";
import type { ModuleSettingsDoc } from "@patchwork/filesystem";
import type { ToolImplementation } from "@patchwork/plugins";
import type { TinyPatchworkAccountDoc } from "tiny-patchwork/src/lib/account-doc.ts";
const pkg = JSON.parse(
  await (await fetch(new URL("../package.json", import.meta.url))).text()
);

export const plugins = [
  {
    type: "patchwork:tool",
    ...pkg.patchwork.tools["chee/sideboard"],
    id: "chee/sideboard",
    supportedDataTypes: ["folder"],
    async load(): Promise<ToolImplementation<TinyPatchworkAccountDoc>> {
      const sideboard = await import("./sideboard.tsx");
      const style = await (
        await fetch(new URL("../style.css", import.meta.url))
      ).text();

      const sheet = new CSSStyleSheet();
      await sheet.replace(style);

      return (handle, element) => {
        document.adoptedStyleSheets = [sheet];
        return render(
          () => <sideboard.default handle={handle} repo={element.repo} />,
          element
        );
      };
    },
  },
  {
    type: "patchwork:tool",
    ...pkg.patchwork.tools["chee/module-settings"],
    id: "chee/module-settings",
    async load(): Promise<ToolImplementation<ModuleSettingsDoc>> {
      const modulesettings = await import("./module-settings.jsx");
      const style = await (
        await fetch(new URL("./style.css", import.meta.url))
      ).text();

      const sheet = new CSSStyleSheet();
      await sheet.replace(style);

      return function (handle, element) {
        document.adoptedStyleSheets = [sheet];
        return render(
          () => <modulesettings.default handle={handle} repo={element.repo} />,
          element
        );
      };
    },
  },
];
