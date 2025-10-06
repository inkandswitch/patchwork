import {
  RepoContext,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { ToolProps } from "@patchwork/plugins";
import { createRoot } from "react-dom/client";

const Frame = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [account] = useDocument(docUrl, { suspense: true });

  return (
    <div>
      tiny patchwork frame:
      <pre>{JSON.stringify(account, null, 2)}</pre>
    </div>
  );
};

export const renderFrame = ({ repo, handle, element }: ToolProps) => {
  const root = createRoot(element);
  root.render(
    <RepoContext.Provider value={repo}>
      <Frame docUrl={handle.url} />
    </RepoContext.Provider>
  );
};
