import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import type { AutomergeUrl } from "@automerge/automerge-repo";

// SCHEMA

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  authorUrl: AutomergeUrl;
  replyTo?: string;
  edited?: boolean;
  deletedAt?: number;
  reactions: Reaction[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface TypingIndicator {
  userUrl: AutomergeUrl;
  timestamp: number;
}

export interface Doc {
  messages: ChatMessage[];
  title: string;
  readReceipts: Record<string, Record<string, number>>;
  typingUsers: TypingIndicator[];
}

// FUNCTIONS

export const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Conversation";
};

export const init = (doc: Doc) => {
  initFrom(doc, {
    title: "New Conversation",
    messages: [],
    readReceipts: {},
    typingUsers: [],
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};
