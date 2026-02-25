import { render } from "solid-js/web";
import { SyncIndicator, RepoContext } from "./SyncIndicator";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

const mount: ToolImplementation = (handle, element) => {
  element.style.width = "fit-content";
  element.style.zIndex = "10";

  const dispose = render(
    () => (
      <RepoContext.Provider value={element.repo}>
        <SyncIndicator handle={handle} />
      </RepoContext.Provider>
    ),
    element
  );

  return dispose;
};

export default mount;
