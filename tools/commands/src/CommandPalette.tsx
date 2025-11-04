import { Command } from "cmdk";
import { useEffect, useRef, useState } from "react";

export interface CommandArg {
  name: string;
  placeholder?: string;
  description?: string;
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  action: (...args: any[]) => void | Promise<void>;
  category?: string;
  args?: CommandArg[];
}

declare global {
  interface Window {
    commands: CommandItem[];
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<CommandItem | null>(
    null
  );
  const [argValues, setArgValues] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const argInputRef = useRef<HTMLInputElement>(null);

  // Toggle palette with CMD+O and close with Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "o" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  // Focus input when palette opens or when showing arg form
  useEffect(() => {
    if (open && !selectedCommand) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else if (selectedCommand) {
      setTimeout(() => {
        argInputRef.current?.focus();
      }, 0);
    }
  }, [open, selectedCommand]);

  const handleSelect = async (cmd: CommandItem) => {
    if (cmd.args && cmd.args.length > 0) {
      // Show argument form
      setSelectedCommand(cmd);
      setArgValues(new Array(cmd.args.length).fill(""));
    } else {
      // Execute immediately
      setOpen(false);
      setSearch("");
      await cmd.action();
    }
  };

  const handleArgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommand) return;

    setOpen(false);
    setSearch("");
    setSelectedCommand(null);
    await selectedCommand.action(...argValues);
    setArgValues([]);
  };

  const handleBack = () => {
    setSelectedCommand(null);
    setArgValues([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const commands = ((window as any).commands as CommandItem[]) || [];

  // Group commands by category
  const categorizedCommands = commands.reduce(
    (acc, cmd) => {
      const category = cmd.category || "Commands";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>
  );

  if (!open) return null;

  // Show argument form if a command with args is selected
  if (selectedCommand && selectedCommand.args) {
    return (
      <div className="command-palette-backdrop" onClick={() => setOpen(false)}>
        <div
          className="command-palette-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="command-palette-header">
            <button
              onClick={handleBack}
              className="command-palette-back-button"
            >
              ← Back
            </button>
            <span className="command-palette-header-title">
              {selectedCommand.label}
            </span>
          </div>
          <form onSubmit={handleArgSubmit} className="command-palette-arg-form">
            {selectedCommand.args.map((arg, index) => (
              <div key={arg.name} className="command-palette-arg-input-group">
                <label className="command-palette-arg-label">
                  {arg.name}
                  {arg.description && (
                    <span className="command-palette-arg-description">
                      {arg.description}
                    </span>
                  )}
                </label>
                <input
                  ref={index === 0 ? argInputRef : undefined}
                  type="text"
                  value={argValues[index]}
                  onChange={(e) => {
                    const newValues = [...argValues];
                    newValues[index] = e.target.value;
                    setArgValues(newValues);
                  }}
                  placeholder={arg.placeholder}
                  className="command-palette-arg-input"
                />
              </div>
            ))}
            <div className="command-palette-arg-actions">
              <button
                type="button"
                onClick={handleBack}
                className="command-palette-arg-button command-palette-arg-button-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="command-palette-arg-button command-palette-arg-button-submit"
              >
                Run Command
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="command-palette-backdrop" onClick={() => setOpen(false)}>
      <div
        className="command-palette-container"
        onClick={(e) => e.stopPropagation()}
      >
        <Command value={search} onValueChange={setSearch}>
          <Command.Input
            ref={inputRef}
            placeholder="Type a command or search..."
            className="command-palette-input"
          />
          <Command.List className="command-palette-list">
            <Command.Empty className="command-palette-empty">
              No results found.
            </Command.Empty>
            {Object.entries(categorizedCommands).map(([category, items]) => (
              <Command.Group key={category} heading={category}>
                {items.map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={`${cmd.label} ${cmd.description || ""}`}
                    onSelect={() => handleSelect(cmd)}
                    className="command-palette-item"
                  >
                    <div className="command-palette-item-content">
                      <span className="command-palette-item-label">
                        {cmd.label}
                      </span>
                      {cmd.description && (
                        <span className="command-palette-item-description">
                          {cmd.description}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
