import { asyncComputedPromise } from "@patchwork/sdk/async-signals";
import { Icon } from "@patchwork/sdk/ui";
import { DocLink, DocPath, DocPathUtils } from "@patchwork/sdk/router";
import {
  FolderDoc,
  FolderDocMaterialized as FolderDocWithChildren,
  FolderDocWithMetadata,
} from "@patchwork/sdk/borrowed-bits";
import { dataTypeById } from "@patchwork/sdk";
import { Input } from "@patchwork/sdk/ui";
import {
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnActiveBranch,
} from "@patchwork/sdk/versionControl";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";

import capitalize from "lodash-es/capitalize";
import clone from "lodash-es/clone";
import uniqBy from "lodash-es/uniqBy";

import { ChevronsLeft } from "lucide-react";
import React, { useMemo, useState } from "react";
import { MoveHandler, RenameHandler, Tree } from "react-arborist";
import { useCurrentAccount, useCurrentAccountDoc } from "@patchwork/sdk";
import { UIStateDoc } from "@patchwork/sdk/router";
import { AccountPicker } from "../AccountPicker";
import { FillFlexParent } from "../FillFlexParent";
import { useDataTypes } from "@patchwork/sdk/hooks";
import DataTypeSelector from "./DataTypeSelector";
import { OpenAutomergeUrl } from "./OpenAutomergeUrl";
import { Node, FlatDocPathsContext, NodeData } from "./Node";

const prepareDataForTree = (
  folderDoc: FolderDocWithChildren,
  folderPath: DocPath
): NodeData[] => {
  if (!folderDoc) {
    return [];
  }
  return uniqBy(folderDoc.docs, "url").map((docLink) => {
    const childDocPath = [...folderPath, docLink];
    return {
      docPath: childDocPath,
      children:
        docLink.type === "folder" && docLink.folderContents
          ? prepareDataForTree(docLink.folderContents, childDocPath)
          : [],
    };
  });
};

type SidebarProps = {
  rootFolderDoc: FolderDocWithMetadata;
  selectedDocPath: DocPath | undefined;
  selectDocPath: (docPath: DocPath | undefined) => void;
  hideSidebar: () => void;
  addNewDocument: (doc: { type: string }) => void;
};

const idAccessor = (data: NodeData) => {
  return DocPathUtils.toString(data.docPath);
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDocPath,
  selectDocPath,
  hideSidebar,
  addNewDocument,
  rootFolderDoc,
}) => {
  const repo = useRepo();
  const dataTypes = useDataTypes();

  const {
    doc: rootFolderDocWithChildren,
    rootFolderUrl,
    flatDocPaths,
  } = rootFolderDoc;

  const [searchQuery, setSearchQuery] = useState("");

  const [accountDoc] = useCurrentAccountDoc();

  const [uiStateDoc, changeUIStateDoc] = useDocument<UIStateDoc>(
    accountDoc?.uiStateUrl
  );

  const account = useCurrentAccount();

  const onMove: MoveHandler<NodeData> = async ({
    parentNode,
    index: dragTargetIndex,
    dragNodes,
  }) => {
    // Here's how this interacts with branching...
    // 1. The original folder entry is always removed from the source folder on
    //    its active branch.
    // 2. A new folder entry is always added to the destination folder on its
    //    active branch.
    // 3. If the original item was on a branch, strictly UNDER its branch scope,
    //    then we need to make sure we're moving the contents it has on that
    //    branch to the destination location. There are two cases here...
    //    - If the destination location is on the same branch, we can just move
    //      the directory entry (which refers to the main copy) over verbatim.
    //    - If the destination location is on a different branch, we need to
    //      create a new directory entry that refers to the clone on the branch.
    //      This sort of breaks our rule about not putting clone URLs into data,
    //      but I think it's ok; we're promoting a clone to a main copy.

    for (const dragNode of dragNodes) {
      const srcPath = dragNode.data.docPath;
      const srcLink = DocPathUtils.toLink(srcPath);
      const srcUrl = srcLink.url;
      const srcParentPath = DocPathUtils.parent(srcPath);
      const srcParentOm = await asyncComputedPromise(() =>
        fetchOmOnActiveBranch<FolderDoc>(srcParentPath, account, repo)
      );
      const dragItemIndex = srcParentOm.doc.docs.findIndex(
        (item) => item.url === DocPathUtils.toLink(dragNode.data.docPath).url
      );
      if (dragItemIndex === -1) {
        throw new Error("Couldn't find drag item in parent folder");
      }

      const dstParentPath: DocPath =
        !parentNode || parentNode.level < 0
          ? DocPathUtils.forRoot(rootFolderUrl)
          : parentNode.data.docPath;
      const dstParentOm = await asyncComputedPromise(() =>
        fetchOmOnActiveBranch<FolderDoc>(dstParentPath, account, repo)
      );

      // Time for the subtlety listed under #3 above...
      const overrideUrl = await asyncComputedPromise(() => {
        const srcBranchInfo = fetchBranchScopeAndActiveBranchInfo(
          srcPath,
          account,
          repo
        );
        if (
          srcBranchInfo.activeBranchOm && // we're on a branch
          srcBranchInfo.branchScopeOm.url !== srcUrl // the branch scope lies above
        ) {
          const dstBranchInfo = fetchBranchScopeAndActiveBranchInfo(
            dstParentPath,
            account,
            repo
          );
          if (
            dstBranchInfo.activeBranchOm?.url !==
            srcBranchInfo.activeBranchOm.url
          ) {
            return srcBranchInfo.cloneOrMainOm.url;
          }
        }
      });

      // If we're dragging later within the same folder, we need to account for
      // the fact that the array will be shorter after we remove the original element
      const adjustedTargetIndex =
        DocPathUtils.toString(srcParentPath) ===
          DocPathUtils.toString(dstParentPath) &&
        dragItemIndex < dragTargetIndex
          ? dragTargetIndex - 1
          : dragTargetIndex;

      let removedItem: DocLink;
      srcParentOm.handle.change((d) => {
        const spliceResult = d.docs.splice(dragItemIndex, 1);
        removedItem = clone({ ...spliceResult[0] });
      });
      dstParentOm.handle.change((d) => {
        if (overrideUrl) {
          removedItem.url = overrideUrl;
        }
        d.docs.splice(adjustedTargetIndex, 0, removedItem);
      });
    }
  };

  const rootFolderPath = DocPathUtils.forRoot(rootFolderUrl);
  const openModuleSettings = () => {
    selectDocPath([
      ...rootFolderPath,
      {
        name: "My Tools",
        type: "my-tools",
        url: accountDoc!.moduleSettingsUrl!,
      },
    ]);
  };

  const dataForTree = prepareDataForTree(
    rootFolderDocWithChildren,
    DocPathUtils.forRoot(rootFolderUrl)
  );

  const treeSelection = selectedDocPath
    ? DocPathUtils.toString(selectedDocPath)
    : undefined;

  const onRename: RenameHandler<NodeData> = async ({ node, name }) => {
    const docPath = node.data.docPath;
    const docLink = DocPathUtils.toLink(docPath);
    const dataType = dataTypeById(docLink?.type)!; // TODO: JAH strict fix

    if (!dataType?.setTitle) {
      alert(
        `${capitalize(
          dataType.name
        )} documents can only be renamed in the main editor, not the sidebar.`
      );
      return;
    }

    if (!docLink) {
      return;
    }

    const docOm = await asyncComputedPromise(() =>
      fetchOmOnActiveBranch<FolderDoc>(docPath, account, repo)
    );
    const parentPath = DocPathUtils.parent(docPath);
    const parentOm = await asyncComputedPromise(() =>
      fetchOmOnActiveBranch<FolderDoc>(parentPath, account, repo)
    );

    // rename doc link
    parentOm.handle.change((d) => {
      const doc = d.docs.find((doc) => doc.url === docLink.url);
      if (doc) {
        doc.name = name;
      }
    });

    // rename doc title
    docOm.handle.change((doc) => {
      dataType.setTitle?.(doc, name);
    });

    selectDocPath([...parentPath, { ...docLink, name }]); // TODO: JAH strict fix
  };

  const onToggle = async (id: string) => {
    if (!uiStateDoc) {
      // TODO: the tree component calls onToggle in response to the initial
      // `selection`; this causes an error in the below changeUIStateDoc cuz the
      // ui state doc isn't ready; this hack seems to work? but i dunno
      return;
    }
    changeUIStateDoc((uiState) => {
      // Initialize the list of toggled open doc paths if it doesn't exist
      // (This is basically a data migration on the fly...)
      if (!uiState.docPathsToggledOpenInSidebar) {
        uiState.docPathsToggledOpenInSidebar = [];

        // Remove a deprecated field that was previously used to store this info.
        // @ts-expect-error: openedFoldersInSidebar is no longer a field we want
        if (uiState.openedFoldersInSidebar) {
          // @ts-expect-error: openedFoldersInSidebar is no longer a field we want
          delete uiState.openedFoldersInSidebar;
        }
      }
      if (uiState.docPathsToggledOpenInSidebar.includes(id)) {
        const index = uiState.docPathsToggledOpenInSidebar.indexOf(id);
        if (index !== -1) {
          uiState.docPathsToggledOpenInSidebar.splice(index, 1);
        }
      } else {
        uiState.docPathsToggledOpenInSidebar.push(id);
      }
    });
  };

  const initialOpenState = useMemo(
    () =>
      (uiStateDoc?.docPathsToggledOpenInSidebar ?? []).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, true>),
    [uiStateDoc]
  );

  // Show a loading spinner until we've recursively loaded all folder contents
  if (rootFolderDocWithChildren === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-10 py-2 px-4 font-semibold text-gray-500 text-sm flex">
        <div className="mw-40 mt-[3px]">My Documents</div>
        <div className="ml-auto">
          <div
            className="text-gray-400 hover:bg-gray-300 hover:text-gray-500 cursor-pointer  transition-all p-1 m-[-4px] mr-[-8px] rounded-sm"
            onClick={hideSidebar}
          >
            <ChevronsLeft />
          </div>
        </div>
      </div>
      <div className="py-2  border-b border-gray-200">
        <DataTypeSelector
          dataTypes={dataTypes}
          addNewDocument={addNewDocument}
        />
        <OpenAutomergeUrl addNewDocument={addNewDocument} />
        <div
          className={`py-1 px-2 text-sm  cursor-pointer ${
            selectedDocPath &&
            DocPathUtils.toLink(selectedDocPath).type === "my-tools"
              ? " bg-gray-300 hover:bg-gray-300 text-gray-900"
              : "text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => openModuleSettings()}
        >
          <Icon
            type={"Cog"}
            size={14}
            className="inline-block font-bold mr-2 align-top mt-[2px]"
          />
          My Tools
        </div>
      </div>

      <div className="mx-2 my-2 flex gap-2 items-center">
        <Input
          placeholder="Search my docs..."
          className="h-6"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div
          className={`text-gray-400 text-xs cursor-pointer ${
            searchQuery.length > 0 ? "" : "invisible"
          }`}
          onClick={() => setSearchQuery("")}
        >
          Clear
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        <FillFlexParent>
          {({ width, height }) => {
            return (
              <FlatDocPathsContext.Provider value={flatDocPaths}>
                <Tree
                  data={dataForTree}
                  width={width}
                  height={height}
                  openByDefault={false}
                  searchTerm={searchQuery}
                  searchMatch={(node, term) => {
                    const docName = DocPathUtils.toLink(node.data.docPath).name;
                    return docName.toLowerCase().includes(term.toLowerCase());
                  }}
                  rowHeight={28}
                  selection={treeSelection}
                  idAccessor={idAccessor}
                  onSelect={(selections) => {
                    if (
                      !selections ||
                      selections.length === 0 ||
                      // ignore on select if the selection hasn't changed
                      // this can happens when the tree component is being initialized
                      selections[0].id === treeSelection
                    ) {
                      return false;
                    }
                    selectDocPath(selections[0].data.docPath);
                  }}
                  // For now, don't allow deleting w/ backspace key in the sidebar—
                  // it's too unsafe without undo.
                  // onDelete={({ ids }) => {
                  //   for (const id of ids) {
                  //     deleteFromAccountDocList(id as AutomergeUrl);
                  //   }
                  // }}
                  onMove={onMove}
                  // Notably toggle state is "uncontrolled" state that the component manages privately --
                  // after initial mount, the component stores in-memory state privately, and we also
                  // send all updates to automerge in order to rehydrate on next page load or next mount.
                  // That seems fine for this state where it's not a huge problem if the component desyncs
                  // from the automerge doc.
                  initialOpenState={initialOpenState}
                  onToggle={onToggle}
                  onRename={onRename}
                >
                  {Node}
                </Tree>
              </FlatDocPathsContext.Provider>
            );
          }}
        </FillFlexParent>
      </div>

      <div className="h-12 border-t border-gray-300 py-1 px-2 bg-gray-200">
        <AccountPicker showName />
      </div>
    </div>
  );
};
