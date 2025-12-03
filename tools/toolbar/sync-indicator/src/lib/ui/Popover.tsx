import React, { useState, useRef, useEffect } from "react";

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface PopoverContentProps {
  className?: string;
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export const Popover: React.FC<PopoverProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  className = "",
  children,
}) => {
  const { setOpen, triggerRef } = React.useContext(PopoverContext);

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({
  className = "",
  children,
}) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 w-72 rounded-md border border-gray-200 bg-white p-4 shadow-md outline-none ${className}`}
      style={{ top: "100%", right: 0, marginTop: "0.5rem" }}
    >
      {children}
    </div>
  );
};
