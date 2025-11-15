import React from "react";
import Markdown from "react-markdown";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`chat ${
            message.role === "user" ? "chat-end" : "chat-start"
          }`}
        >
          <div
            className={`chat-bubble text-sm ${
              message.role === "user"
                ? "chat-bubble-neutral"
                : "bg-base-200 text-base-content"
            }`}
          >
            <Markdown>{message.content}</Markdown>
          </div>
        </div>
      ))}
    </>
  );
};

