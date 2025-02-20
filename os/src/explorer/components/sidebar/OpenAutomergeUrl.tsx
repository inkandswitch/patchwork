import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import {
  Icon,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@patchwork/sdk/ui";
import { useState } from "react";

interface OpenAutomergeUrlProps {
  addNewDocument: (doc: { type: string }) => void;
}

export const OpenAutomergeUrl = ({ addNewDocument }: OpenAutomergeUrlProps) => {
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

  return (
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
          <Icon
            type="FolderInput"
            size={14}
            className="inline-block font-bold mr-2 align-top mt-[2px]"
          />
          Open document...
        </PopoverTrigger>
        <PopoverContent className="w-96 h-20" side="right">
          <Input
            value={openUrlInput}
            placeholder="automerge:<url>"
            onChange={(e) => setOpenUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && automergeUrlToOpen) {
                alert("This is broken.");
                // addNewDocument(... something)
                // openDocFromUrl(automergeUrlToOpen); // TODO FIX THIS
                setOpenUrlInput("");
                setOpenNewDocPopoverVisible(false);
              }
            }}
            className={`outline-hidden ${
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
  );
};
