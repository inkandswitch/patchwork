import React from "react";
import { BotIcon } from "lucide-react";

interface BotEditorHeaderProps {
  onClearHistory: () => void;
}

export const BotEditorHeader: React.FC<BotEditorHeaderProps> = ({
  onClearHistory,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <BotIcon size={16} />
      <span className="font-semibold">Bot Editor</span>
      <div className="flex gap-2 ml-auto">
        <button className="btn btn-ghost btn-xs" onClick={onClearHistory}>
          Clear History
        </button>
      </div>
    </div>
  );
};

