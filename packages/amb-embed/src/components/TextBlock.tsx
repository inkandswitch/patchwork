import React from "react";

interface TextBlockProps {
  block: {
    type: "text";
    content: string;
  };
  index: number;
  onUpdateTextBlock: (index: number, content: string) => void;
  onDeleteBlock: (index: number) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  index,
  onUpdateTextBlock,
  onDeleteBlock,
}) => {
  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm group">
      <div className="flex justify-between items-start">
        <div className="text-sm">
          <textarea
            value={block.content}
            onChange={(e) => onUpdateTextBlock(index, e.target.value)}
          />
        </div>
        <button
          onClick={() => onDeleteBlock(index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
