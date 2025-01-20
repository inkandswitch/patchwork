import { Button } from "@patchwork/sdk/ui";
import { useCurrentAccount } from "@patchwork/sdk";
import { MarkdownInput } from "@patchwork/sdk/markdown";
import { TimelineItems } from "@patchwork/sdk/versionControl";
import {
  DiscussionComment,
  HasVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { uuid } from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { next as A } from "@automerge/automerge";
import { SendHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { ChangelogSelection } from "./sidebar/TimelineSidebar";

type DiscussionInputProps<D> = {
  doc: D;
  handle: DocHandle<D>;
  changelogItems: TimelineItems<D>[];
  changelogSelection: ChangelogSelection;
};
export const DiscussionInput = function <
  D extends HasVersionControlMetadata<unknown, unknown>
>({
  doc,
  handle,
  changelogItems,
  changelogSelection,
}: DiscussionInputProps<D>) {
  const account = useCurrentAccount();
  const [commentBoxContent, setCommentBoxContent] = useState("");

  // only allow comments on most recent version
  const isInputDisabled = changelogSelection !== undefined;

  const createDiscussion = () => {
    if (commentBoxContent === "" || !account) {
      return;
    }

    /** migration for legacy docs */

    const comment: DiscussionComment = {
      id: uuid(),
      content: commentBoxContent,
      timestamp: Date.now(),
      contactUrl: account.contactHandle.url,
    };
    const discussionId = uuid();

    handle.change((doc) => {
      if (!doc.discussions) {
        doc.discussions = {};
      }

      doc.discussions[discussionId] = {
        id: discussionId,
        heads: A.getHeads(doc),
        resolved: false,
        comments: [comment],
        anchors: [],
      };
    });

    setCommentBoxContent("");
  };

  const onKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key === "Enter" && (evt.ctrlKey || evt.metaKey)) {
      evt.stopPropagation();
      evt.preventDefault();
      createDiscussion();
    }
  };

  return (
    <div className="border-t border-gray-200 pt-2 px-2 bg-gray-50 z-10">
      <div>
        <div className="rounded bg-white shadow">
          <div className="p-1" onKeyDownCapture={onKeyDown}>
            <MarkdownInput
              value={commentBoxContent}
              onChange={changelogSelection ? undefined : setCommentBoxContent}
              docHandle={handle}
            />
          </div>
          <div className="flex justify-end mt-2 text-sm">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={createDiscussion}
                disabled={isInputDisabled}
              >
                <SendHorizontalIcon size={14} className="mr-1" />
                Write a note
                <span className="text-gray-400 text-xs ml-2">(⌘+enter)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>{" "}
    </div>
  );
};
