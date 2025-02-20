import { Repo, AutomergeUrl } from "@automerge/automerge-repo";
import { type DocPath, DocPathUtils } from "@patchwork/sdk/router";
import { type FolderDoc } from "@patchwork/folder";
import {
  UIStateDoc,
  Account,
  dataTypeById,
  createDocOfDataType,
} from "@patchwork/sdk";
import { asyncComputedPromise } from "@patchwork/sdk/async-signals";
import { Om } from "@patchwork/sdk/om";
import {
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnActiveBranch,
} from "@patchwork/sdk/versionControl";

export async function addNewDocument({
  type,
  change,
  uiStateOm,
  repo,
  selectedDocPath,
  selectedDataTypeId,
  selectDocPath,
  rootFolderUrl,
  account,
}: {
  type: string;
  uiStateOm: Om<UIStateDoc> | undefined;
  change?: (doc: unknown) => void;
  repo: Repo;
  selectedDocPath: DocPath | undefined;
  selectedDataTypeId: string | undefined;
  selectDocPath: (path: DocPath | undefined) => void;
  rootFolderUrl: AutomergeUrl | undefined;
  account: Account | undefined;
}): Promise<void> {
  if (!uiStateOm) {
    throw new Error("uiStateHandle not ready");
  }

  const dataType = dataTypeById(type);
  if (!dataType) {
    throw new Error(`Unsupported document type: ${type}`);
  }

  const newDocHandle = createDocOfDataType(dataType, repo, change);

  let parentFolderDocPath: DocPath;
  if (!selectedDocPath) {
    if (!rootFolderUrl) {
      throw new Error("Root folder URL not ready");
    }
    parentFolderDocPath = DocPathUtils.forRoot(rootFolderUrl);
  } else if (selectedDataTypeId === "folder") {
    parentFolderDocPath = selectedDocPath;
  } else {
    parentFolderDocPath = DocPathUtils.parent(selectedDocPath);
  }

  const branchScopeAndActiveBranchInfoOfParentFolder =
    await asyncComputedPromise(() =>
      fetchBranchScopeAndActiveBranchInfo<FolderDoc>(
        parentFolderDocPath,
        account,
        repo
      )
    );
  const { activeBranchOm } = branchScopeAndActiveBranchInfoOfParentFolder;

  if (activeBranchOm) {
    activeBranchOm.handle.change((branchDoc) => {
      branchDoc.clones[newDocHandle.url] = {
        url: newDocHandle.url,
        baseHeads: [],
      };
    });
  }

  const newDocLink = {
    url: newDocHandle.url,
    type,
    name: "Untitled document",
  };

  branchScopeAndActiveBranchInfoOfParentFolder.cloneOrMainOm.handle.change(
    (folderDoc) => {
      folderDoc.docs.unshift(newDocLink);
    }
  );

  selectDocPath([...parentFolderDocPath, newDocLink]);
}
export async function removeDocPath({
  docPath,
  account,
  repo,
  selectDocPath,
}: {
  docPath: DocPath;
  account: any;
  repo: any;
  selectDocPath: (path: DocPath | undefined) => void;
}): Promise<void> {
  const docLink = DocPathUtils.toLink(docPath);
  const parentFolderDocPath = DocPathUtils.parent(docPath);
  const parentFolderOm = await asyncComputedPromise(() =>
    fetchOmOnActiveBranch<FolderDoc>(parentFolderDocPath, account, repo)
  );
  const parentFolderDoc = parentFolderOm.doc;
  const itemIndex = parentFolderDoc.docs.findIndex(
    (item) => item.url === docLink.url
  );
  if (itemIndex >= 0) {
    if (itemIndex < parentFolderDoc.docs.length - 1) {
      selectDocPath([
        ...parentFolderDocPath,
        parentFolderDoc.docs[itemIndex + 1],
      ]);
    } else if (itemIndex > 1) {
      selectDocPath([
        ...parentFolderDocPath,
        parentFolderDoc.docs[itemIndex - 1],
      ]);
    } else {
      selectDocPath(undefined);
    }
    setTimeout(() => {
      parentFolderOm.handle.change((doc) => {
        doc.docs.splice(itemIndex, 1);
      });
    }, 0);
  }
}
