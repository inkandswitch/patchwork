# Chat Tool

A reusable chat interface component for Patchwork that displays messages and allows users to add new messages.

## Features

- Display chat messages with different types:
  - User messages (text)
  - Assistant text messages
  - Assistant thinking messages (with progress indicators)
  - Assistant action messages (with status indicators)
- Add new user messages via a text input area
- Auto-scroll to latest messages
- Markdown rendering for message content

## Data Type

The chat tool works with a `ChatDocument` data type that has the following structure:

```typescript
type ChatDocument = {
  messages: ChatMessages[];
  activeDocUrls?: string[];
  accountDocUrl?: string;
  modelId?: string;
};
```

### Message Types

**UserMessage:**
```typescript
{
  id: string;
  timestamp: number;
  role: "user";
  type: "text";
  content: string;
}
```

**AssistantTextMessage:**
```typescript
{
  id: string;
  timestamp: number;
  role: "assistant";
  type: "text";
  content: string;
}
```

**AssistantThinkingMessage:**
```typescript
{
  id: string;
  timestamp: number;
  role: "assistant";
  type: "thinking";
  description: string;
  content: string;
  inProgress: boolean;
}
```

**AssistantActionMessage:**
```typescript
{
  id: string;
  timestamp: number;
  role: "assistant";
  type: "action";
  actionId: string;
  description: string;
  args: any;
  status: "pending" | "success" | "error";
  error?: string;
  beforeHead?: string;
  afterHead?: string;
}
```

## Usage

The chat tool is designed to:

1. **Render messages** - Display all message types in the chat history
2. **Add user messages** - Allow users to type and send messages
3. **Not handle agent responses** - This tool does NOT create agent/assistant messages. That should be handled by other components (like the agent tool)

### Example

Other tools can import the types and work with chat documents:

```typescript
import { ChatDocument, ChatMessage } from "@tiny-patchwork/chat";

// Work with chat documents
const chatHandle = repo.create<ChatDocument>();
chatHandle.change((doc) => {
  doc.messages = [];
});
```

## Development

```bash
# Build the tool
pnpm build

# Watch mode
pnpm dev

# Build and sync
pnpm sync
```

## Styling

The chat tool uses Tailwind CSS and DaisyUI for styling. Custom styles are defined in `src/styles.css`.



