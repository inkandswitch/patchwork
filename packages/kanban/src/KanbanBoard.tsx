import { EditorProps } from "@patchwork/sdk";
import { next as A } from "@automerge/automerge";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import "animate.css/animate.min.css";
import { createContext, useState } from "react";
import IssueModal from "./components/IssueModal";
import { KanbanBoardDoc } from "./datatype";
import Board from "./pages/Board";
import Issue from "./pages/Issue";
import { useHandleDef } from "@patchwork/sdk/hooks";

interface MenuContextInterface {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
}

export const MenuContext = createContext(null as MenuContextInterface | null);

export const KanbanBoard = ({
  docUrl,
  docHeads,
}: EditorProps<KanbanBoardDoc, never>) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [_doc, changeDoc] = useDocument<KanbanBoardDoc>(docUrl);
  const handle = useHandleDef<KanbanBoardDoc>(docUrl);
  const [openIssueId, setOpenIssueId] = useState<string | undefined>();

  if (!_doc) {
    return;
  }

  const doc = docHeads ? A.view(_doc, docHeads) : _doc;

  return (
    <MenuContext.Provider value={{ showMenu, setShowMenu }}>
      {openIssueId ? (
        <Issue
          id={openIssueId}
          doc={doc}
          changeDoc={changeDoc}
          handle={handle}
          setOpenIssueId={setOpenIssueId}
        />
      ) : (
        <Board
          doc={doc}
          changeDoc={changeDoc}
          setOpenIssueId={setOpenIssueId}
          setShowIssueModal={setShowIssueModal}
        />
      )}
      <IssueModal
        isOpen={showIssueModal}
        lanes={doc.lanes}
        changeDoc={changeDoc}
        docWithAssetsHandle={handle}
        onDismiss={() => setShowIssueModal(false)}
      />
    </MenuContext.Provider>
  );
};
