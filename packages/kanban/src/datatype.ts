import { initFrom, type DataType } from "@/sdk";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import { uuid } from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";

// SCHEMA

export type Lane = {
  id: string;
  title: string;
  cardIds: string[];
};

export type Card = {
  id: string;
  title: string;
  description: string;
  modifiedTimestamp: number;
  createdTimestamp: number;
  createdByContactUrl: AutomergeUrl;
};

export type KanbanBoardDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  lanes: Lane[];
  cards: Card[];
};

// FUNCTIONS

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
export const markCopy = (doc: KanbanBoardDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: KanbanBoardDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: KanbanBoardDoc) => {
  return doc.title || "Untitled Kanban Board";
};

export const init = (doc: KanbanBoardDoc) => {
  initFrom(doc, {
    title: "Untitled Kanban Board",
    lanes: [
      {
        id: uuid(),
        title: "Backlog",
        cardIds: [],
      },
      {
        id: uuid(),
        title: "To Do",
        cardIds: [],
      },
      {
        id: uuid(),
        title: "In Progress",
        cardIds: [],
      },
      {
        id: uuid(),
        title: "Done",
        cardIds: [],
      },
      {
        id: uuid(),
        title: "Canceled",
        cardIds: [],
      },
    ],
    cards: [],
  });
};

export const kanbanBoardDatatype: DataType<KanbanBoardDoc, never, never> = {
  type: "patchwork:dataType",
  id: "kanban",
  name: "Kanban Board",
  icon: "KanbanSquare",
  isExperimental: true,
  init,
  getTitle,
  setTitle,
  markCopy, // TODO: this shouldn't be here
};
