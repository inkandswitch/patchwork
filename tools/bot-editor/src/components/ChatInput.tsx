import React from "react";
import { SendIcon } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
}) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        className="textarea textarea-bordered w-full h-20 resize-none"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
              onSend();
            }
          }
        }}
        placeholder="Make it more X..."
      />
      <button
        onClick={onSend}
        className="btn btn-ghost btn-sm absolute bottom-2 right-2 h-8 w-8 min-h-0 p-0"
        disabled={!value.trim() || disabled}
      >
        <SendIcon size={16} />
      </button>
    </div>
  );
};

