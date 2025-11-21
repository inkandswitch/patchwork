import {
  AutomergeUrl,
  isValidAutomergeUrl,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "@patchwork/react";
import { MessageSquareIcon, SendIcon, BotIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import "./styles.css";
import type { ChatDocument, UserMessage } from "./types";
import { AgentDocument, step } from "../../agent/src/Agent";

const Chat = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const repo = useRepo();
  const [chatDoc, changeChatDoc] = useDocument<ChatDocument>(docUrl, {
    suspense: true,
  });
  const [pendingMessage, setPendingMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatDoc?.messages]);

  // Handle sending message
  const handleUserMessage = async () => {
    if (!pendingMessage.trim()) {
      return;
    }

    const userMessage: UserMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "user",
      type: "text",
      content: pendingMessage,
      timestamp: Date.now(),
    };

    changeChatDoc((doc: ChatDocument) => {
      if (!doc.messages) doc.messages = [];
      doc.messages.push(userMessage);
    });

    setPendingMessage("");

    // for now just use first agent
    if (chatDoc.agentDocUrls.length === 0) {
      return;
    }

    const agentDocUrl = chatDoc.agentDocUrls[0];
    const agentDocHandle = await repo.find<AgentDocument>(agentDocUrl);

    const docUrls = extractAutomergeUrls(pendingMessage);

    console.log("add these to agent: ", docUrls);

    if (docUrls.length > 0) {
      agentDocHandle.change((doc) => {
        for (const docUrl of docUrls) {
          if (!doc.activeDocUrls.includes(docUrl)) {
            doc.activeDocUrls.push(docUrl);
          }
        }
      });
    }

    step(agentDocUrl, repo);
  };

  if (!chatDoc) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const lastMessage = chatDoc.messages[chatDoc.messages.length - 1];
  const isLastMessagePending =
    (lastMessage?.type === "thinking" && lastMessage.inProgress) ||
    (lastMessage?.type === "action" && lastMessage.status === "pending");

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <MessageSquareIcon size={16} />
        <span className="font-semibold">Chat</span>
      </div>

      {/* Attached Agents Section */}
      {chatDoc.agentDocUrls && chatDoc.agentDocUrls.length > 0 && (
        <div className="px-4 py-2 border-b bg-base-200">
          <div className="flex items-center gap-2 text-sm">
            <BotIcon size={14} />
            <span className="font-medium">Attached agents:</span>
            <div className="flex gap-2 flex-wrap">
              {chatDoc.agentDocUrls.map((agentUrl, idx) => {
                const { documentId } = parseAutomergeUrl(agentUrl);

                return (
                  <a
                    key={agentUrl}
                    className="badge badge-sm badge-primary cursor-pointer"
                    title={agentUrl}
                    href={`#doc=${documentId}&tool=agent`}
                  >
                    Agent {idx + 1}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-1 min-h-0">
        {chatDoc.messages.map((message, index) => {
          if (message.role === "user") {
            return (
              <div key={message.id || index} className="chat chat-end">
                <div className="chat-bubble chat-bubble-primary">
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            );
          }

          if (message.type === "thinking") {
            // Don't render if in progress and no content yet
            if (message.inProgress && !message.content) {
              return null;
            }

            return (
              <div key={message.id || index} className="chat chat-start">
                <div className="chat-bubble chat-bubble-info text-info-content">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{message.description}</span>
                    {message.inProgress && (
                      <span className="loading loading-dots loading-xs"></span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (message.type === "action") {
            // Don't render if no actionId yet (incomplete)
            if (!message.actionId) {
              return null;
            }

            const icon =
              message.status === "success" ? (
                "✓"
              ) : message.status === "error" ? (
                "✗"
              ) : (
                <span className="loading loading-dots loading-xs"></span>
              );

            const bubbleColor =
              message.status === "success"
                ? "chat-bubble-success"
                : message.status === "error"
                  ? "chat-bubble-error"
                  : "chat-bubble-warning";

            return (
              <div key={message.id || index} className="chat chat-start">
                <div className={`chat-bubble ${bubbleColor}`}>
                  <div className="flex items-center gap-2">
                    <span>{message.description}</span>
                    <span>{icon}</span>
                  </div>
                  {message.error && (
                    <div className="text-xs opacity-80 mt-1">
                      {message.error}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Assistant text - plain text, no bubble
          if (message.type === "text") {
            // Don't render empty text messages
            if (!message.content || !message.content.trim()) {
              return null;
            }

            return (
              <div key={message.id || index} className="chat chat-start">
                <div className="chat-bubble">
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            );
          }

          return null;
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex flex-col gap-2 p-2">
        <div className="relative">
          <textarea
            value={pendingMessage}
            className="textarea textarea-bordered w-full h-20 resize-none"
            onChange={(e) => setPendingMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (pendingMessage.trim()) {
                  handleUserMessage();
                }
              }
            }}
            placeholder="Type your message..."
          />
          <button
            onClick={handleUserMessage}
            className="btn btn-ghost btn-sm absolute bottom-2 right-2 h-8 w-8 min-h-0 p-0"
            disabled={!pendingMessage.trim() || isLastMessagePending}
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const renderChat = toolify(Chat);

function extractAutomergeUrls(text: string): AutomergeUrl[] {
  const docUrls: AutomergeUrl[] = [];

  // First, match automerge:... URLs as before
  const automergePattern = /automerge:[a-zA-Z0-9]{28}/g;
  const automergeMatches = text.match(automergePattern) || [];
  for (const match of automergeMatches) {
    if (isValidAutomergeUrl(match)) {
      docUrls.push(match);
    }
  }

  // Second, match any URL containing /#doc=<id>
  // Example: http://localhost:5173/#doc=45oVmqdzjpcYMD5WJUFoNYcgnzEw&title=...
  // We'll extract the "doc" parameter value (should be 28 chars, likely automerge id)
  // Accepts http(s) or plain domain as well
  const docParamPattern =
    /(?:https?:\/\/[^\s]*|[^\s]+)?\/#doc=([a-zA-Z0-9]{28})\b/g;
  let match: RegExpExecArray | null;
  while ((match = docParamPattern.exec(text))) {
    const foundId = match[1];
    const possibleUrl = `automerge:${foundId}`;
    if (isValidAutomergeUrl(possibleUrl) && !docUrls.includes(possibleUrl)) {
      docUrls.push(possibleUrl);
    }
  }

  return docUrls;
}
