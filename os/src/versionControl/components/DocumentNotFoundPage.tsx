import { DocLink } from "@patchwork/folder";
import { toHashUrl } from "@patchwork/sdk";
import { BranchScopeAndActiveBranchInfo } from "@patchwork/sdk/versionControl";
import { CrownIcon } from "lucide-react";

export const DocumentNotFoundPage = ({
  branchScopeAndActiveBranchInfo,
  docLink,
}: {
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  docLink: DocLink;
}) => {
  const selectedBranchName =
    branchScopeAndActiveBranchInfo.activeBranchOm?.doc.name;

  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Document not found</h2>
        <p className="text-gray-700 mb-4">
          <span className="bg-white border border-gray-300 shadow-sm px-2 py-1 rounded-md inline-flex gap-1 items-center">
            {!selectedBranchName && <CrownIcon className="inline" size={12} />}
            {selectedBranchName ?? "Main"}
          </span>{" "}
          does not contain the document{" "}
          <span className="font-bold">{docLink.name}</span>.
        </p>
        <p className="text-gray-600">
          It may have been deleted or not yet created on this branch.
        </p>

        <p className="mt-4">
          <a
            href={toHashUrl({
              type: "folder",
              url: branchScopeAndActiveBranchInfo.branchScopeOm.url,
              name: "",
            })}
            className="text-blue-600 hover:underline"
          >
            Go to root of branch
          </a>
        </p>
      </div>
    </div>
  );
};
