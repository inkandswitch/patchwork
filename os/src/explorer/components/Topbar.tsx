import {
  FileExportMethod,
  genericExportMethods,
} from "@patchwork/sdk/fileExports";
import { useDataTypes } from "@patchwork/sdk/hooks";
import { FolderDoc, DocPath } from "@patchwork/folder";
import { dataTypeById } from "@patchwork/sdk";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@patchwork/sdk/ui";
import { Tabs, TabsList, TabsTrigger } from "@patchwork/sdk/ui";
import { useToast } from "@patchwork/sdk/ui";
import { Tool } from "@patchwork/sdk";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge";
import { Doc, DocHandle, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  Download,
  GitForkIcon,
  Menu,
  MoreHorizontal,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import React, { useRef } from "react";
import { saveFile } from "@patchwork/sdk/fileUtils";
import { AccountPicker } from "./AccountPicker";
import {
  AUTOMERGE_SYNC_SERVER_STORAGE_ID,
  BACKUP_SYNC,
  JACQUARD_SYNC_SERVER_STORAGE_ID,
  SyncIndicator,
} from "./SyncIndicator";
import { getUrlSafeName } from "@patchwork/sdk/router";

type TopbarProps = {
  showSidebar: boolean;
  setShowSidebar: (showSidebar: boolean) => void;
  selectedDocPath: DocPath | undefined;
  selectDocPath: (docPath: DocPath | undefined) => void;
  selectedDoc: Doc<HasVersionControlMetadata<unknown, unknown>> | undefined;
  selectedDocHandle:
    | DocHandle<HasVersionControlMetadata<unknown, unknown>>
    | undefined;
  addNewDocument: (doc: { type: string }) => void;
  removeDocPath: (docPath: DocPath) => void;
  tools: Tool[];
  tool: Tool;
  setToolId: (id: string) => void;
  docHeadsFromTimelineSidebar?: Automerge.Heads;
};

export const Topbar: React.FC<TopbarProps> = ({
  showSidebar,
  setShowSidebar,
  selectDocPath,
  selectedDocPath,
  selectedDoc,
  selectedDocHandle,
  tools,
  tool,
  setToolId: setToolModuleId,
  removeDocPath,
  docHeadsFromTimelineSidebar,
}) => {
  const repo = useRepo();
  const { toast } = useToast();

  const selectedDocLink = selectedDocPath && DocPath.toLink(selectedDocPath);
  const selectedDocUrl = selectedDocLink?.url;
  const selectedDocName = selectedDocLink?.name;
  const selectedDataTypeId = selectedDocLink?.type;
  const selectedDataTypeRef = useRef<string>();
  selectedDataTypeRef.current = selectedDataTypeId;

  const dataTypes = useDataTypes();
  const selectedDataType = dataTypeById(dataTypes, selectedDataTypeId);

  const toolsWithEditorComponent = tools.filter((tool) => tool.EditorComponent);

  const onClickMakeCopy = async () => {
    if (
      !selectedDocHandle ||
      !selectedDataType ||
      !selectedDocPath ||
      !selectedDocLink
    ) {
      // TODO: JAH strict fix lazy
      throw new Error("something unexpected is missing idk");
    }

    let newHandle: DocHandle<HasVersionControlMetadata>;

    if (docHeadsFromTimelineSidebar) {
      newHandle = repo.create<HasVersionControlMetadata>();

      const originalDoc = await selectedDocHandle.doc();

      if (!originalDoc) {
        throw new Error("can't load doc");
      }

      const changes = Automerge.getAllChanges(originalDoc);

      let cutOff = 0;
      for (const change of changes) {
        cutOff += 1;
        const decodeChange = Automerge.decodeChange(change);

        if (decodeChange.hash === docHeadsFromTimelineSidebar[0]) {
          break;
        }
      }

      const [docAtHeads] = Automerge.applyChanges(
        Automerge.init<HasVersionControlMetadata>(),
        changes.slice(0, cutOff)
      );

      newHandle.update((doc) => Automerge.merge(doc, docAtHeads));
    } else {
      newHandle =
        repo.clone<HasVersionControlMetadata<unknown, unknown>>(
          selectedDocHandle
        );
    }

    newHandle.change((doc) => {
      selectedDataType.markCopy(doc);
    });

    const newDocLink = {
      url: newHandle.url,
      name: await selectedDataType.getTitle(newHandle.docSync(), repo),
      type: selectedDocLink.type,
    };

    const folderDocPath = DocPath.parent(selectedDocPath);

    if (!docHeadsFromTimelineSidebar) {
      const folderHandle = repo.find<FolderDoc>(
        DocPath.toLink(folderDocPath).url
      );
      const folderDoc = await folderHandle.doc();
      const index = folderDoc!.docs.findIndex(
        (doc) => doc.url === selectedDocUrl
      );
      folderHandle.change((doc) => doc.docs.splice(index + 1, 0, newDocLink));
    }

    // TODO: we used to have a setTimeout here, see if we need to bring it back.
    selectDocPath([...folderDocPath, newDocLink]);
  };

  const onClickExport = async (method: FileExportMethod<unknown>) => {
    // TODO move this exporting logic into a more centralized place?
    // but for now this is the only place it's called, so seems fine...

    if (!selectedDoc || !selectedDocLink) {
      // TODO: JAH strict fix lazy
      throw new Error("something unexpected is missing idk");
    }
    const blob = await method.export(selectedDoc, repo);
    const defaultFilename = `${getUrlSafeName(selectedDocLink.name)}.${
      typeof method.fileExtension === "function"
        ? method.fileExtension(selectedDoc!)
        : method.fileExtension
    }`;
    const filename = method.filename
      ? method.filename(selectedDoc!)
      : defaultFilename;

    console.log({ defaultFilename, filename });
    const contentType =
      typeof method.contentType === "function"
        ? method.contentType(selectedDoc!)
        : method.contentType;

    saveFile(blob, filename, [
      {
        accept: {
          [contentType]: [`.${method.fileExtension}`],
        },
      },
    ]);
  };

  return (
    <div className="h-10 bg-gray-100 flex items-center flex-shrink-0 border-b border-gray-300">
      {!showSidebar && (
        <div
          className="ml-1 p-1 text-gray-500 bg-gray-100 hover:bg-gray-300 hover:text-gray-500 cursor-pointer  transition-all rounded-sm"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu size={18} />
        </div>
      )}
      <div className="ml-3 text-sm text-gray-700 font-bold">
        {/* {selectedDataType &&
          React.createElement(selectedDataType.icon, {
            className: "inline mr-1",
            size: 14,
          })} */}
        {selectedDocName}
      </div>
      <div className="ml-1 mt-[-2px]">
        {isValidAutomergeUrl(selectedDocUrl) && (
          <>
            <SyncIndicator
              docUrl={selectedDocUrl}
              storageId={AUTOMERGE_SYNC_SERVER_STORAGE_ID}
              name={"sync.automerge.org"}
            />
            {BACKUP_SYNC && (
              <SyncIndicator
                docUrl={selectedDocUrl}
                storageId={JACQUARD_SYNC_SERVER_STORAGE_ID}
                name={"jacquard.sync"}
              />
            )}
          </>
        )}
      </div>

      {toolsWithEditorComponent.length > 1 && selectedDocLink && (
        <Tabs
          value={tool?.id}
          className="ml-auto"
          onValueChange={setToolModuleId}
        >
          <TabsList>
            {toolsWithEditorComponent.map((tool) => (
              <TabsTrigger value={tool.id} className="px-2 py-1" key={tool.id}>
                {tool.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className={`mr-4 ${tools.length <= 1 ? "ml-auto" : "ml-4"}`}>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontal
              size={18}
              className="mt-1 mr-21 text-gray-500 hover:text-gray-800"
            />
          </DropdownMenuTrigger>
          {selectedDoc && (
            <DropdownMenuContent className="mr-4">
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <ShareIcon
                  className="inline-block text-gray-500 mr-2"
                  size={14}
                />{" "}
                Copy share URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClickMakeCopy}>
                <GitForkIcon
                  className="inline-block text-gray-500 mr-2"
                  size={14}
                />{" "}
                {!docHeadsFromTimelineSidebar
                  ? "Make a copy of latest version"
                  : "Make a copy of visible version"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(selectedDataType?.fileExportMethods ?? [])
                .concat(genericExportMethods)
                .map((method, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => onClickExport(method)}
                  >
                    <Download
                      size={14}
                      className="inline-block text-gray-500 mr-2"
                    />{" "}
                    Export as{" "}
                    {typeof method.exportMethodName === "function"
                      ? method.exportMethodName(selectedDoc)
                      : method.exportMethodName}
                  </DropdownMenuItem>
                ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  selectedDocPath && removeDocPath(selectedDocPath)
                }
              >
                <Trash2Icon
                  className="inline-block text-gray-500 mr-2"
                  size={14}
                />{" "}
                Remove doc from folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
          {!selectedDoc && (
            <DropdownMenuContent className="mr-4 p-4">
              <div className="text-gray-500 text-xs">
                Open a document to see actions
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      <div className="mr-4 mt-1">
        <AccountPicker />
      </div>
    </div>
  );
};
