import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Env } from "@patchwork/ambsheet";
import { Button } from "@patchwork/sdk/ui/button";

interface LinkedSheetsProps {
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheets: Record<AutomergeUrl, Env>;
  onChange: (newSheets: { [key: string]: AutomergeUrl }) => void;
}

export const LinkedSheets: React.FC<LinkedSheetsProps> = ({
  linkedSheets,
  onChange,
}) => {
  const [newSheetName, setNewSheetName] = React.useState("");
  const [newSheetUrl, setNewSheetUrl] = React.useState("");

  const handleAdd = () => {
    if (!newSheetName || !newSheetUrl) return;

    onChange({
      ...linkedSheets,
      [newSheetName]: newSheetUrl as AutomergeUrl,
    });

    setNewSheetName("");
    setNewSheetUrl("");
  };

  const handleRemove = (sheetName: string) => {
    const newSheets = { ...linkedSheets };
    delete newSheets[sheetName];
    onChange(newSheets);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Object.entries(linkedSheets).map(([name, url]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="font-medium">{name}:</span>
            <span className="font-mono text-sm text-gray-600 flex-1">
              {url}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemove(name)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSheetName}
          onChange={(e) => setNewSheetName(e.target.value)}
          placeholder="Sheet name"
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          value={newSheetUrl}
          onChange={(e) => setNewSheetUrl(e.target.value)}
          placeholder="Automerge URL"
          className="px-2 py-1 border rounded flex-1"
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
    </div>
  );
};
