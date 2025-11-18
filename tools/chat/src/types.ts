// Base message properties
export type BaseMessage = {
  id: string;
  timestamp: number;
};

// User can only send text messages
export type UserMessage = BaseMessage & {
  role: "user";
  type: "text";
  content: string;
};

// Assistant can send text, thinking, or action messages
export type AgentTextMessage = BaseMessage & {
  role: "assistant";
  type: "text";
  content: string;
};

export type AgentThinkingMessage = BaseMessage & {
  role: "assistant";
  type: "thinking";
  description: string;
  content: string;
  inProgress: boolean;
};

export type AgentActionMessage = BaseMessage & {
  role: "assistant";
  type: "action";
  actionId: string;
  description: string;
  args: any;
  status: "pending" | "success" | "error";
  error?: string;
  beforeHead?: string;
  afterHead?: string;
};

export type AgentMessage =
  | AgentTextMessage
  | AgentThinkingMessage
  | AgentActionMessage;

export type ChatMessage = UserMessage | AgentMessage;

export type ChatDocument = {
  messages: ChatMessage[];
  activeDocUrls?: string[];
  accountDocUrl?: string;
  modelId?: string;
};
