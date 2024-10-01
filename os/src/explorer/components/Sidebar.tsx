import { asyncComputedPromise, fetchDoc } from "@/async-signals";
import { useAsyncComputed } from "@/async-signals/react";
import { Icon, IconType } from "@/lib/icons";
import {
  DocLink,
  DocLinkWithFolderPath,
  FolderDoc,
  FolderDocWithChildren,
} from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { FolderDocWithMetadata } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { useDataTypes } from "@/hooks/useDataTypes";
import { dataTypeById } from "@/sdk";
import { Input } from "@/shadcn/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import {
  fakeDocPath,
  fetchActiveBranchInfo,
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnBranchFromPath,
  fetchVersionControlMetadataOm,
} from "@/versionControl/signals";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { capitalize, clone, uniqBy } from "lodash";
import {
  AlertCircle,
  ChevronsLeft,
  FolderInput,
  GitBranchIcon,
} from "lucide-react";
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
import {
  useCurrentAccount,
  useCurrentAccountDoc,
  useDatatypeSettings,
} from "../account";
import { docPathString, UIStateDoc } from "../uiState";
import { AccountPicker } from "./AccountPicker";
import { FillFlexParent } from "./FillFlexParent";

const FlatDocLinksContext = createContext<DocLinkWithFolderPath[]>([]);

const Node = (props: NodeRendererProps<DocLinkWithFolderPath>) => {
  const { node, style, dragHandle } = props;
  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, node.data.type);

  const flatDocLinks = useContext(FlatDocLinksContext);

  const redundantWith = useMemo(() => {
    if (node.data.folderPath.length > 1) {
      return;
    }

    return flatDocLinks.find((docLink) => {
      return docLink.url === node.data.url && docLink.folderPath.length > 1;
    });
  }, [flatDocLinks, node.data]);

  let icon;
  if (node.data.type === "folder") {
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
          node.data.type === "folder" && "hover:bg-gray-400 text-gray-800"
        } p-1 mr-0.5 rounded-sm transition-all`}
        onClick={(e) => {
          if (node.data.type === "folder") {
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
            {dataType ? node.data.name : `Unknown type: ${node.data.type}`}
          </div>
          {node.data.type === "folder" && (
            <div className="ml-2 text-gray-500 text-xs py-0.5 px-1.5 rounded-lg bg-gray-200">
              {node.children?.length || 0}
            </div>
          )}
          <NodeActiveBranchInfo {...props} />
          {redundantWith && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="ml-1">
                  <div className="ml-1">
                    <AlertCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs text-gray-500">
                  In{" "}
                  {
                    flatDocLinks.find(
                      (docLink) => docLink.url === redundantWith.folderPath[1]
                    )?.name
                  }
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

const NodeActiveBranchInfo = (
  props: NodeRendererProps<DocLinkWithFolderPath>
) => {
  const { node } = props;

  const docPath = fakeDocPath(node.data);
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
    const showActiveBranchName = node.data.type === "folder" || node.isSelected;
    if (!showActiveBranchName) {
      return undefined;
    }
    const doc = fetchDoc<HasVersionControlMetadata>(node.data.url, repo);
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
  }).ifPending(() => (
    <div className="text-xs text-gray-300 flex items-center gap-1">
      <GitBranchIcon size={14} className="ml-1" />
    </div>
  ));
};

const Edit = ({ node }: NodeRendererProps<DocLinkWithFolderPath>) => {
  const input = useRef<any>();

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  return (
    <input
      ref={input}
      defaultValue={node.data.name}
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
  selectedDocLink: DocLinkWithFolderPath | undefined;
  selectDocLink: (docLink: DocLinkWithFolderPath | undefined) => void;
  hideSidebar: () => void;
  addNewDocument: (doc: { type: string }) => void;
};

const prepareDataForTree = (
  folderDoc: FolderDocWithChildren,
  folderPath: AutomergeUrl[]
): DocLinkWithFolderPath[] => {
  if (!folderDoc) {
    return [];
  }
  return uniqBy(folderDoc.docs, "url").map((docLink) => ({
    ...docLink,
    folderPath,
    children:
      docLink.type === "folder" && docLink.folderContents
        ? prepareDataForTree(docLink.folderContents, [
            ...folderPath,
            docLink.url,
          ])
        : undefined,
  }));
};

const idAccessor = (item: DocLinkWithFolderPath) => {
  return JSON.stringify({
    url: item.url,
    folderPath: item.folderPath,
  });
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDocLink,
  selectDocLink,
  hideSidebar,
  addNewDocument,
  rootFolderDoc,
}) => {
  const repo = useRepo();
  const dataTypes = useDataTypes();

  const {
    doc: rootFolderDocWithChildren,
    rootFolderUrl,
    flatDocLinks,
  } = rootFolderDoc;

  const datatypeSettings = useDatatypeSettings();

  // state related to open popover
  const [openNewDocPopoverVisible, setOpenNewDocPopoverVisible] =
    useState(false);
  const [openUrlInput, setOpenUrlInput] = useState("");
  const automergeUrlMatch = openUrlInput
    .replace(/%3A/g, ":")
    .match(/(automerge:[a-zA-Z0-9]*)/);
  const automergeUrlToOpen =
    automergeUrlMatch &&
    automergeUrlMatch[1] &&
    isValidAutomergeUrl(automergeUrlMatch[1])
      ? automergeUrlMatch[1]
      : null;

  const [searchQuery, setSearchQuery] = useState("");

  const [accountDoc] = useCurrentAccountDoc();

  const [uiStateDoc, changeUIStateDoc] = useDocument<UIStateDoc>(
    accountDoc?.uiStateUrl
  );

  const account = useCurrentAccount();

  const onMove: MoveHandler<DocLinkWithFolderPath> = async ({
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
      const srcUrl = dragNode.data.url;
      const srcPath = fakeDocPath(dragNode.data);
      const srcParentPath = srcPath.slice(0, -1);
      const srcParentOm = await asyncComputedPromise(() =>
        fetchOmOnBranchFromPath<FolderDoc>(srcParentPath, account, repo)
      );
      const dragItemIndex = srcParentOm.doc.docs.findIndex(
        (item) => item.url === dragNode.data.url
      );
      if (dragItemIndex === -1) {
        throw new Error("Couldn't find drag item in parent folder");
      }

      const dstParentPath: DocPath =
        !parentNode || parentNode.level < 0
          ? fakeDocPath({
              url: rootFolderUrl,
              name: "root",
              type: "folder",
              folderPath: [],
            })
          : fakeDocPath(parentNode.data);
      const dstParentOm = await asyncComputedPromise(() =>
        fetchOmOnBranchFromPath<FolderDoc>(dstParentPath, account, repo)
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
        docPathString(srcParentPath) === docPathString(dstParentPath) &&
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

  const dataForTree = prepareDataForTree(rootFolderDocWithChildren, [
    rootFolderUrl,
  ]);

  const treeSelection = selectedDocLink
    ? idAccessor(selectedDocLink)
    : undefined;

  const onRename: RenameHandler<DocLinkWithFolderPath> = async ({
    node,
    name,
  }) => {
    const docLink = flatDocLinks.find((doc) => doc.url === node.data.url);
    const dataType = dataTypeById(dataTypes, docLink?.type)!; // TODO: JAH strict fix

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

    const docPath = fakeDocPath(node.data);
    const docOm = await asyncComputedPromise(() =>
      fetchOmOnBranchFromPath<FolderDoc>(docPath, account, repo)
    );
    const parentPath = docPath.slice(0, -1);
    const parentOm = await asyncComputedPromise(() =>
      fetchOmOnBranchFromPath<FolderDoc>(parentPath, account, repo)
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

    selectDocLink({ ...selectedDocLink!, name }); // TODO: JAH strict fix
  };

  const onToggle = async (id: string) => {
    if (!uiStateDoc) {
      // TODO: the tree component calls onToggle in response to the initial
      // `selection`; this causes an error in the below changeUIStateDoc cuz the
      // ui state doc isn't ready; this hack seems to work? but i dunno
      return;
    }
    const link = JSON.parse(id);
    changeUIStateDoc((uiState) => {
      if (
        uiState.openedFoldersInSidebar.find((folder) => folder.url === link.url)
      ) {
        const index = uiState.openedFoldersInSidebar.findIndex(
          (folder) => folder.url === link.url
        );
        if (index !== -1) {
          uiState.openedFoldersInSidebar.splice(index, 1);
        }
      } else {
        uiState.openedFoldersInSidebar.push(link);
      }
    });
  };

  const initialOpenState = useMemo(
    () =>
      (uiStateDoc?.openedFoldersInSidebar ?? []).reduce((acc, key) => {
        acc[
          // This is gross: we need to make sure that JSON stringify does the keys in the right order...
          JSON.stringify({
            url: key.url,
            folderPath: key.folderPath,
          })
        ] = true;
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
        {dataTypes.map((dataType) => {
          const { id } = dataType;
          const isEnabled = datatypeSettings?.enabledDatatypeIds[id];
          if (
            isEnabled == false ||
            (isEnabled !== true && dataType.isExperimental) ||
            dataType.disableManualCreation
          ) {
            return;
          }

          return (
            <div key={dataType.id}>
              {" "}
              <div
                className="py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 "
                onClick={() => addNewDocument({ type: id })}
              >
                <Icon
                  type={dataType.icon}
                  size={14}
                  className="inline-block font-bold mr-2 align-top mt-[2px]"
                />
                New {dataType.name}
              </div>
            </div>
          );
        })}

        <div
          className="py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 "
          onClick={() => setOpenNewDocPopoverVisible(true)}
        >
          {/* todo: extract a component for this */}
          <Popover
            open={openNewDocPopoverVisible}
            onOpenChange={setOpenNewDocPopoverVisible}
          >
            <PopoverTrigger>
              <FolderInput
                size={14}
                className="inline-block font-bold mr-2 align-top mt-[2px]"
              />
              Open document
            </PopoverTrigger>
            <PopoverContent className="w-96 h-20" side="right">
              <Input
                value={openUrlInput}
                placeholder="automerge:<url>"
                onChange={(e) => setOpenUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && automergeUrlToOpen) {
                    // openDocFromUrl(automergeUrlToOpen); // TODO FIX THIS
                    setOpenUrlInput("");
                    setOpenNewDocPopoverVisible(false);
                  }
                }}
                className={`outline-none ${
                  automergeUrlToOpen
                    ? "bg-green-100"
                    : openUrlInput.length > 0
                    ? "bg-red-100"
                    : ""
                }`}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {automergeUrlToOpen && <> {"\u23CE"} Enter to open </>}
                {openUrlInput.length > 0 &&
                  !automergeUrlToOpen &&
                  "Not a valid Automerge URL"}
              </div>
            </PopoverContent>
          </Popover>
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
              <FlatDocLinksContext.Provider value={flatDocLinks}>
                <Tree
                  data={dataForTree}
                  width={width}
                  height={height}
                  openByDefault={false}
                  searchTerm={searchQuery}
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
                    const newlySelectedDocLink = selections[0].data;
                    if (isValidAutomergeUrl(newlySelectedDocLink.url)) {
                      selectDocLink(newlySelectedDocLink);
                    }
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
              </FlatDocLinksContext.Provider>
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
