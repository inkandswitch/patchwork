import { render } from "solid-js/web";
import type { ModuleSettingsDoc } from "@inkandswitch/patchwork-filesystem";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { ModuleSettings } from "./module-settings/module-settings.tsx";

const mount: ToolImplementation<ModuleSettingsDoc> = (handle, element) => {
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

export default mount;
