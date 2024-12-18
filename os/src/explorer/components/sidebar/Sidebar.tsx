import {
  useAsyncComputed,
  asyncComputedPromise,
  fetchDoc,
} from "@patchwork/sdk/async-signals";
import { Icon, IconType } from "@patchwork/sdk/ui";
import {
  DocLink,
  FolderDoc,
  DocPath,
  FolderDocWithChildren,
  FolderDocWithMetadata,
  DocPathUtils,
} from "@patchwork/folder";
import { dataTypeById } from "@patchwork/sdk";
import {
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@patchwork/sdk/ui";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import {
  fetchActiveBranchInfo,
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnActiveBranch,
  fetchVersionControlMetadataOm,
} from "@patchwork/sdk/versionControl";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";

import capitalize from "lodash-es/capitalize";
import clone from "lodash-es/clone";
import uniqBy from "lodash-es/uniqBy";

import { AlertCircle, ChevronsLeft, GitBranchIcon } from "lucide-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MoveHandler,
  NodeRendererProps,
  RenameHandler,
  Tree,
} from "react-arborist";
import { useCurrentAccount, useCurrentAccountDoc } from "@patchwork/sdk";
import { UIStateDoc } from "@patchwork/sdk/router";
import { AccountPicker } from "../AccountPicker";
import { FillFlexParent } from "../FillFlexParent";
import { useDataTypes } from "@patchwork/sdk/hooks";
import DataTypeSelector from "./DataTypeSelector";
import { OpenAutomergeUrl } from "./OpenAutomergeUrl";

const FlatDocPathsContext = createContext<DocPath[]>([]);

// React Arborist expects a particular format for data: nodes with
// children. We transform our data into that format here.
type NodeData = {
  docPath: DocPath;
  children: NodeData[];
};
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

const Node = (props: NodeRendererProps<NodeData>) => {
  const { node, style, dragHandle } = props;
  const docPath = node.data.docPath;
  const docLink = DocPathUtils.toLink(docPath);
  const dataType = dataTypeById(docLink.type);

  const flatDocPaths = useContext(FlatDocPathsContext);

  // We often end up in a situation where a doc that's deep in some
  // folder structure is also present at the top level, cuz it was
  // loaded that way first. This is a little feature to identify such
  // cases.
  const redundantWithPath = useMemo(() => {
    if (docPath.length > 2) {
      return;
    }

    return flatDocPaths.find((otherDocPath) => {
      if (otherDocPath.length > 2) {
        const otherDocLink = DocPathUtils.toLink(otherDocPath);
        return docLink.url === otherDocLink.url;
      }
    });
  }, [docLink.url, docPath.length, flatDocPaths]);

  let icon;
  if (docLink.type === "folder") {
    if (node.isOpen) {
      icon = "ChevronDown";
    } else {
      icon = "ChevronRight";
    }
  } else {
    icon = dataType?.icon;
  }

  return (
    <div
      style={style}
      ref={dragHandle}
      className={`flex items-center cursor-pointer text-sm py-1 w-full truncate ${
        node.isSelected
          ? " bg-gray-300 hover:bg-gray-300 text-gray-900"
          : "text-gray-600 hover:bg-gray-200"
      }`}
      onDoubleClick={() => node.edit()}
    >
      <div
        className={`${node.isSelected ? "text-gray-800" : "text-gray-500"} ${
          docLink.type === "folder" && "hover:bg-gray-400 text-gray-800"
        } p-1 mr-0.5 rounded-sm transition-all`}
        onClick={(e) => {
          if (docLink.type === "folder") {
            node.toggle();
            e.stopPropagation();
          }
        }}
      >
        <Icon type={icon as IconType} size={14} />
      </div>

      {!node.isEditing && (
        <div className="flex items-center">
          <div className="">
            {dataType ? docLink.name : `Unknown type: ${docLink.type}`}
          </div>
          {docLink.type === "folder" && (
            <div className="ml-2 text-gray-500 text-xs py-0.5 px-1.5 rounded-lg bg-gray-200">
              {node.children?.length || 0}
            </div>
          )}
          <NodeActiveBranchInfo {...props} />
          {redundantWithPath && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="ml-1">
                  <div className="ml-1">
                    <AlertCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs text-gray-500">
                  In {DocPathUtils.toLink(redundantWithPath).name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      {node.isEditing && <Edit {...props} />}
    </div>
  );
};

const NodeActiveBranchInfo = (props: NodeRendererProps<NodeData>) => {
  const { node } = props;
  const docPath = node.data.docPath;
  const docLink = DocPathUtils.toLink(docPath);
  const repo = useRepo();
  const account = useCurrentAccount();

  return useAsyncComputed(() => {
    // For performance reasons, we only show the active branch on
    // certain nodes to avoid eagerly loading too much data.
    // - We show it for the currently selected sidebar entry, which
    //   should already have data loaded
    // - We show it for folders, because a folder can be a branch
    //   scope for its contents, and it's helpful to see the branch
    //   name on the folder to indicate that it's a branch scope.
    const showActiveBranchName = docLink.type === "folder" || node.isSelected;
    if (!showActiveBranchName) {
      return undefined;
    }
    const doc = fetchDoc<HasVersionControlMetadata>(docLink.url, repo);
    const versionControlMetadataDoc = fetchVersionControlMetadataOm(
      doc,
      repo
    )?.doc;
    if (versionControlMetadataDoc?.isBranchScope) {
      const { activeBranchOm } = fetchActiveBranchInfo(docPath, account, repo);
      const activeBranchName = activeBranchOm?.doc.name ?? "Main";
      return (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <GitBranchIcon size={14} className="ml-1" />
          {activeBranchName}
        </div>
      );
    }
  })
    .ifPending(() => (
      <div className="text-xs text-gray-300 flex items-center gap-1">
        <GitBranchIcon size={14} className="ml-1" />
      </div>
    ))
    .ifRejected(() => <div></div>).value;
};

const Edit = ({ node }: NodeRendererProps<NodeData>) => {
  const input = useRef<any>();
  const docPath = node.data.docPath;
  const docLink = DocPathUtils.toLink(docPath);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  return (
    <input
      ref={input}
      defaultValue={docLink.name}
      onBlur={() => node.reset()}
      onKeyDown={(e) => {
        if (e.key === "Escape") node.reset();
        if (e.key === "Enter") node.submit(input.current?.value || "");
      }}
    ></input>
  );
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
        name: "My Tools...",
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
          className="py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 "
          onClick={() => openModuleSettings()}
        >
          <Icon
            type={"Cog"}
            size={14}
            className="inline-block font-bold mr-2 align-top mt-[2px]"
          />
          My Tools...
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
