import "./styles.css";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useCallback, useMemo, useState } from "react";
import type { TinyPatchworkLayoutDoc } from "./types";
import type { ToolElement } from "@inkandswitch/patchwork-plugins";
import { useToolDescriptions } from "@patchwork/react";

type ModuleOption = {
  id: string;
  name: string;
};

const FRAME_TOOL_OPTIONS: ModuleOption[] = [
  { id: "patchwork-frame", name: "Patchwork Frame" },
];

const ACCOUNT_SIDEBAR_OPTIONS: ModuleOption[] = [
  { id: "chee/sideboard", name: "Sideboard" },
];

const CONTEXT_SIDEBAR_OPTIONS: ModuleOption[] = [
  { id: "context-sidebar", name: "Context Sidebar" },
];

const DOCUMENT_TOOLBAR_OPTIONS: ModuleOption[] = [
  { id: "document-title", name: "Document Title" },
  { id: "back-link-button", name: "Back Link Button" },
  { id: "spacer", name: "Spacer" },
  { id: "highlight-changes-checkbox", name: "Highlight Changes" },
  { id: "sync-indicator", name: "Sync Indicator" },
  { id: "add-doc-to-sidebar-button", name: "Add doc to sidebar button" },
];

const CONTEXT_TOOL_OPTIONS: ModuleOption[] = [
  { id: "comments-view", name: "Comments" },
  { id: "history-view", name: "History" },
  { id: "context-view", name: "Context" },
];

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ModuleOption[];
}) {
  return (
    <label className="form-control w-full max-w-xl gap-1">
      <span className="label-text text-sm text-base-content/80">{label}</span>

      <select
        className="select select-bordered select-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ArrayEditor({
  label,
  values,
  setValues,
  addOptions,
}: {
  label: string;
  values: string[] | undefined;
  setValues: (next: string[]) => void;
  addOptions: ModuleOption[];
}) {
  const [pendingAdd, setPendingAdd] = useState(addOptions[0]?.id ?? "");

  const move = useCallback(
    (index: number, delta: number) => {
      if (!values) return;
      const next = values.slice();
      const newIndex = index + delta;
      if (newIndex < 0 || newIndex >= next.length) return;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      setValues(next);
    },
    [setValues, values]
  );

  const removeAt = useCallback(
    (index: number) => {
      if (!values) return;
      const next = values.slice();
      next.splice(index, 1);
      setValues(next);
    },
    [setValues, values]
  );

  const add = useCallback(() => {
    const toAdd = pendingAdd;
    const next = [...(values ?? []), toAdd];
    setValues(next);
  }, [pendingAdd, setValues, values]);

  const nameOf = useCallback(
    (id: string) => addOptions.find((o) => o.id === id)?.name ?? id,
    [addOptions]
  );

  return (
    <div
      className="w-full max-w-xl"
      style={{ fontFamily: "Chalkboard SE, Comic Sans MS !important" }}
    >
      <div className="text-sm text-base-content/80 mb-1">{label}</div>
      <div className="flex items-center gap-2 mb-2">
        <select
          className="select select-bordered select-sm"
          value={pendingAdd}
          onChange={(e) => setPendingAdd(e.target.value)}
        >
          {addOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        <button className="btn btn-sm" onClick={add}>
          Add
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {(values ?? []).map((id, index) => (
          <li
            key={`${id}-${index}`}
            className="flex items-center justify-between bg-base-200 rounded px-2 py-1"
          >
            <span className="text-sm">{nameOf(id)}</span>
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => move(index, -1)}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => move(index, 1)}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => removeAt(index)}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FrameConfigurator({
  docUrl,
  element: _element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) {
  const [accountDoc, changeAccountDoc] =
    useDocument<TinyPatchworkLayoutDoc>(docUrl);

  // Dynamically discover tools marked for titlebar
  const allTools = useToolDescriptions();
  const documentToolbarOptions = useMemo(() => {
    return allTools
      .filter((tool) => tool.forTitleBar === true)
      .map((tool) => ({
        id: tool.id,
        name: tool.name || tool.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTools]);

  const frameOptions = FRAME_TOOL_OPTIONS;
  const sidebarOptions = ACCOUNT_SIDEBAR_OPTIONS;
  const contextSidebarOptions = CONTEXT_SIDEBAR_OPTIONS;
  const contextToolOptions = CONTEXT_TOOL_OPTIONS;

  const setField = useCallback(
    <K extends keyof TinyPatchworkLayoutDoc>(
      key: K,
      value: TinyPatchworkLayoutDoc[K]
    ) => {
      changeAccountDoc((doc) => {
        (doc as any)[key] = value as any;
      });
    },
    [changeAccountDoc]
  );

  const setArrayField = useCallback(
    (key: keyof TinyPatchworkLayoutDoc, next: string[]) => {
      changeAccountDoc((doc) => {
        (doc as any)[key] = next;
      });
    },
    [changeAccountDoc]
  );

  const values = useMemo(() => accountDoc ?? null, [accountDoc]);

  if (!values) {
    return (
      <div className="p-4 text-base-content">
        Loading account configuration…
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 text-base-content">
      <h2 className="text-lg font-semibold">Frame Configurator</h2>

      <div className="grid grid-cols-1 gap-4">
        <LabeledSelect
          label="Frame Tool"
          value={values.frameToolId}
          onChange={(v) => setField("frameToolId", v as any)}
          options={frameOptions}
        />

        <LabeledSelect
          label="Account Sidebar Tool"
          value={values.accountSidebarToolId}
          onChange={(v) => setField("accountSidebarToolId", v as any)}
          options={sidebarOptions}
        />

        <LabeledSelect
          label="Context Sidebar Tool"
          value={values.contextSidebarToolId}
          onChange={(v) => setField("contextSidebarToolId", v as any)}
          options={contextSidebarOptions}
        />

        <ArrayEditor
          label="Document Toolbar Tools"
          values={values.documentToolbarToolIds}
          setValues={(next) => setArrayField("documentToolbarToolIds", next)}
          addOptions={documentToolbarOptions}
        />

        <ArrayEditor
          label="Context Tools"
          values={values.contextToolIds}
          setValues={(next) => setArrayField("contextToolIds", next)}
          addOptions={contextToolOptions}
        />
      </div>
    </div>
  );
}
