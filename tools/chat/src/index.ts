import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "chat",
    name: "Chat",
    icon: "MessageSquare",
    supportedDataTypes: ["chat"],
    async load() {
      const { renderChat } = await import("./Chat");
      return renderChat;
    },
  },
  {
    type: "patchwork:datatype",
    id: "chat",
    name: "Chat",
    icon: "MessageSquare",
    async load() {
      const { ChatDataType } = await import("./datatype");
      return ChatDataType;
    },
  },
];
