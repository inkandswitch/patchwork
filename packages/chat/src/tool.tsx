import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import React, { useState, useEffect, useRef } from "react";
import { useCurrentAccount } from "@patchwork/sdk";
import { ContactAvatar, InlineContactAvatar } from "@patchwork/sdk/components";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Icon } from "@patchwork/sdk/ui";

interface Reaction {
  emoji: string;
  users: AutomergeUrl[];
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  authorUrl: AutomergeUrl;
  replyTo?: string;
  edited?: boolean;
  deletedAt?: number;
  reactions: Reaction[];
}

interface TypingIndicator {
  userUrl: AutomergeUrl;
  timestamp: number;
}

interface ChatDoc {
  messages: ChatMessage[];
  title: string;
  readReceipts: Record<AutomergeUrl, { messageId: string; timestamp: number }>;
  typingUsers: TypingIndicator[];
}

const TYPING_TIMEOUT = 3000;
const COMMON_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🤔"];

const ReadReceipt: React.FC<{ readers: AutomergeUrl[] }> = ({ readers }) => (
  <div className="flex -space-x-2">
    {readers.map((url) => (
      <InlineContactAvatar key={url} url={url} size={"default"} />
    ))}
  </div>
);

const ChatMessage: React.FC<{
  message: ChatMessage;
  messages: ChatMessage[];
  onReply: (replyToId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  readBy: string[];
  currentUserUrl: string;
}> = ({
  message,
  messages,
  onReply,
  onEdit,
  onDelete,
  onReact,
  readBy,
  currentUserUrl,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const replyToMessage = message.replyTo
    ? messages.find((m) => m.id === message.replyTo)
    : null;

  const isOwnMessage = message.authorUrl === currentUserUrl;

  if (message.deletedAt) {
    return <div className="text-gray-400 italic text-sm">Message deleted</div>;
  }

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      {replyToMessage && (
        <div className="ml-4 pl-4 border-l-2 border-gray-300 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <InlineContactAvatar
              url={replyToMessage.authorUrl}
              size={"default"}
            />
            {replyToMessage.content}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2">
        <ContactAvatar url={message.authorUrl} size={"default"} />
        <div className="flex-1">
          <div className="relative bg-gray-100 rounded-lg p-3">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 p-1 border rounded"
                  autoFocus
                />
                <button
                  onClick={handleEdit}
                  className="text-green-500 hover:text-green-600"
                >
                  <Icon type="Check" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {message.content}
                {message.edited && (
                  <span className="text-xs text-gray-500 ml-2">(edited)</span>
                )}
              </>
            )}

            {readBy.length > 0 && (
              <div className="absolute bottom-1 right-1">
                <ReadReceipt readers={readBy} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onReply(message.id)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>

            {isOwnMessage && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <Icon type="Pencil" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <Icon type="Trash2" className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <Icon type="SmilePlus" className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 bg-white border rounded-lg p-2 shadow-lg flex gap-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:bg-gray-100 p-1 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message.reactions.length > 0 && (
              <div className="flex gap-1">
                {message.reactions.map((reaction, index) => (
                  <button
                    key={index}
                    onClick={() => onReact(message.id, reaction.emoji)}
                    className={`text-sm rounded-full px-2 py-0.5 ${
                      reaction.users.includes(currentUserUrl)
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {reaction.emoji} {reaction.users.length}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Chat: React.FC<EditorProps<ChatDoc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<ChatDoc>(docUrl);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const account = useCurrentAccount();
  const contactHandle = account?.contactHandle;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [doc?.messages]);

  useEffect(() => {
    if (contactHandle && doc?.messages.length) {
      const latestMessage = doc.messages[doc.messages.length - 1];
      changeDoc((d) => {
        d.readReceipts[contactHandle.url] = {
          messageId: latestMessage.id,
          timestamp: Date.now(),
        };
      });
    }
  }, [doc?.messages]);

  if (!doc || !contactHandle) return null;

  const handleSend = () => {
    if (!newMessage.trim()) return;

    changeDoc((d) => {
      d.messages.push({
        id: crypto.randomUUID(),
        content: newMessage,
        timestamp: Date.now(),
        authorUrl: contactHandle.url,
        replyTo: replyingTo || "",
        reactions: [],
      });

      d.typingUsers = d.typingUsers.filter(
        (u) => u.userUrl !== contactHandle.url
      );
    });

    setNewMessage("");
    setReplyingTo(null);
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      changeDoc((d) => {
        d.typingUsers = [
          ...d.typingUsers.filter((u) => u.userUrl !== contactHandle.url),
          { userUrl: contactHandle.url, timestamp: Date.now() },
        ];
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      changeDoc((d) => {
        d.typingUsers = d.typingUsers.filter(
          (u) => u.userUrl !== contactHandle.url
        );
      });
    }, TYPING_TIMEOUT);
  };

  const getReadBy = (messageId: string): string[] => {
    const message = doc.messages.find((m) => m.id === messageId);
    if (!message) return [];

    return Object.entries(doc.readReceipts)
      .filter(
        ([userUrl, receipt]) =>
          receipt.messageId === messageId && userUrl !== message.authorUrl
      )
      .map(([userUrl]) => userUrl);
  };

  const handleEdit = (messageId: string, newContent: string) => {
    changeDoc((d) => {
      const message = d.messages.find((m) => m.id === messageId);
      if (message) {
        message.content = newContent;
        message.edited = true;
      }
    });
  };

  const handleDelete = (messageId: string) => {
    changeDoc((d) => {
      const message = d.messages.find((m) => m.id === messageId);
      if (message) {
        message.deletedAt = Date.now();
      }
    });
  };

  const handleReact = (messageId: string, emoji: string) => {
    changeDoc((d) => {
      const message = d.messages.find((m) => m.id === messageId);
      if (message) {
        const existingReaction = message.reactions.find(
          (r) => r.emoji === emoji
        );
        if (existingReaction) {
          if (existingReaction.users.includes(contactHandle.url)) {
            existingReaction.users = existingReaction.users.filter(
              (u) => u !== contactHandle.url
            );
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter(
                (r) => r.emoji !== emoji
              );
            }
          } else {
            existingReaction.users.push(contactHandle.url);
          }
        } else {
          message.reactions.push({
            emoji,
            users: [contactHandle.url],
          });
        }
      }
    });
  };

  const activeTypers = doc.typingUsers
    .filter((u) => Date.now() - u.timestamp < TYPING_TIMEOUT)
    .filter((u) => u.userUrl !== contactHandle.url);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold p-4 border-b">{doc.title}</h2>

      <div className="flex-1 overflow-y-auto p-4">
        {doc.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            messages={doc.messages}
            onReply={setReplyingTo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
            readBy={getReadBy(message.id)}
            currentUserUrl={contactHandle.url}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {activeTypers.length > 0 && (
        <div className="px-4 text-sm text-gray-500">
          {activeTypers.map((typer) => (
            <div key={typer.userUrl} className="flex items-center gap-2">
              <InlineContactAvatar url={typer.userUrl} size={"default"} />
              <span>is typing...</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t p-4">
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
            <span>Replying to:</span>
            <InlineContactAvatar
              url={
                doc.messages.find((m) => m.id === replyingTo)?.authorUrl || ""
              }
              size={"default"}
            />
            <span>
              {doc.messages.find((m) => m.id === replyingTo)?.content}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Chat,
});
