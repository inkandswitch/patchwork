import { use, useMemo } from "react";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { toolify } from "../lib/toolify";
import { AccountDoc, getAccountDocHandle } from "../lib/account";

export type PatchworkFrameDoc = {
  sidebarToolId: string;
};

export const renderFrame = toolify(({ docUrl }: { docUrl: AutomergeUrl }) => {
  const repo = useRepo();
  const accountDocHandle = use(
    useMemo(() => getAccountDocHandle(repo), [repo])
  );

  const [frame] = useDocument<PatchworkFrameDoc>(docUrl, { suspense: true });
  const [account] = useDocument<AccountDoc>(accountDocHandle.url, {
    suspense: true,
  });

  return (
    <div className="w-screen h-screen flex">
      <div className="w-[300px] bg-gray-100 p-2">
        <h2 className="text-xl mb-4">tiny patchwork</h2>

        <patchwork-view
          doc-url={account.rootFolderUrl}
          tool-id={frame.sidebarToolId}
        />
      </div>
    </div>
  );
});
