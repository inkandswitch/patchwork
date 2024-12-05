import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui";
import { Copy } from "lucide-react";
import { useState } from "react";

export const CopyButton = ({
  text,
  label = "Copied",
  size,
  className,
}: {
  text: string;
  label?: string;
  size?: number;
  className?: string;
}) => {
  const [isCopyTooltipOpen, setIsCopyTooltipOpen] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(text);

    setIsCopyTooltipOpen(true);

    setTimeout(() => {
      setIsCopyTooltipOpen(false);
    }, 1000);
  };

  return (
    <TooltipProvider>
      <Tooltip open={isCopyTooltipOpen}>
        <TooltipTrigger
          type="button"
          onClick={onCopy}
          onBlur={() => setIsCopyTooltipOpen(false)}
          className={className}
        >
          <Copy size={size} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
