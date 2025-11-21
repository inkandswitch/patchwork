import { type DataTypeImplementation } from "@patchwork/plugins";
import { type AgentDocument } from "./Agent";
import { Repo } from "@automerge/automerge-repo";
import { ChatDocument } from "../../chat/src/types";
import { TodoDoc } from "../../todo/src/Todo";

export const AgentDataType: DataTypeImplementation<AgentDocument> = {
  init(doc, repo: Repo) {
    const chatDocHandle = repo.create<ChatDocument>({
      messages: [],
      agentDocUrls: [],
    });

    doc.chatDocUrl = chatDocHandle.url;
    doc.activeDocUrls = [];

    const todoDocHandle = repo.create<TodoDoc>({
      title: "Agent Tasks",
      todos: [],
    });
    doc.todoListUrl = todoDocHandle.url;
  },
  getTitle(doc: AgentDocument) {
    return "Agent";
  },
  setTitle(_doc: AgentDocument, _title: string) {
    // Agents don't have a user-settable title
    // Title is determined by context
  },
};
