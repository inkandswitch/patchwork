import { render } from "solid-js/web";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

const tool = await import("./file-viewer.tsx");

const mount: ToolImplementation = (handle, element) => {
  return render(
    () => <tool.default handle={handle as any} element={element} />,
    element
  );
};

export default mount;
