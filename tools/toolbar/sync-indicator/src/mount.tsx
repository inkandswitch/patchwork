import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { SyncIndicator } from "./SyncIndicator";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

const mount: ToolImplementation = (handle, element) => {
  element.style.width = "fit-content";
  element.style.zIndex = "10";

  const root = createRoot(element);
  root.render(
    <RepoContext.Provider value={element.repo}>
      <SyncIndicator docUrl={handle.url} />
    </RepoContext.Provider>
  );
  return () => root.unmount();
};

export default mount;
