import React from "react";
import { AutomergeUrl, DocumentId } from "@automerge/automerge-repo";
import { AmbEmbedDoc } from "../datatype";
import { Env } from "@patchwork/ambsheet";

interface LinkedSheetsProps {
  linkedSheets: { [key: string]: AutomergeUrl };
  evaluatedSheets: Record<AutomergeUrl, Env>;
  onChange: (newSheets: { [key: string]: AutomergeUrl }) => void;
}

export const LinkedSheets: React.FC<LinkedSheetsProps> = ({
  linkedSheets,
  evaluatedSheets,
  onChange,
}) => {
  const [newSheetName, setNewSheetName] = React.useState("");
  const [newSheetUrl, setNewSheetUrl] = React.useState("");
  const [openSheets, setOpenSheets] = React.useState<Set<string>>(new Set());

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

  const toggleSheet = (name: string) => {
    const newOpenSheets = new Set(openSheets);
    if (newOpenSheets.has(name)) {
      newOpenSheets.delete(name);
    } else {
      newOpenSheets.add(name);
    }
    setOpenSheets(newOpenSheets);
  };

  return (
    <div className="w-full p-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Linked Sheets</h2>

      <div className="space-y-2">
        {Object.entries(linkedSheets).map(([name, url]) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSheet(name)}
                className="text-gray-500 hover:text-gray-700"
              >
                {openSheets.has(name) ? "▼" : "▶"}
              </button>
              <span className="font-medium">{name}:</span>
              <span className="font-mono text-sm text-gray-600 flex-1">
                {url}
              </span>
              <button
                onClick={() => handleRemove(name)}
                className="text-red-500 hover:text-red-700 px-2 py-1"
              >
                Remove
              </button>
            </div>
            {openSheets.has(name) && (
              <div className="font-mono text-xs text-gray-500 pl-8">
                {JSON.stringify(evaluatedSheets[url], null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
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
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
};
