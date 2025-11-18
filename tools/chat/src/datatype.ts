import { DataTypeImplementation } from "@patchwork/plugins";
import { ChatDocument } from "./types";

export const ChatDataType: DataTypeImplementation<ChatDocument> = {
  init: (doc: ChatDocument) => {
    doc.messages = [];
    doc.agentDocUrls = [];
  },
  getTitle(doc: ChatDocument) {
    return "Chat";
  },
};

