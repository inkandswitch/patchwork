import "./styles.css";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useCallback, useMemo, useState } from "react";
import type { TinyPatchworkLayoutDoc } from "./types";
import type { ToolElement } from "@inkandswitch/patchwork-plugins";
import { useToolDescriptions } from "@inkandswitch/patchwork-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ModuleOption = {
  id: string;
  name: string;
};

function SortableItem({
  id,
  name,
  onRemove,
}: {
  id: string;
  name: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="sortable-item">
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3.5" cy="2" r="1.2" />
          <circle cx="8.5" cy="2" r="1.2" />
          <circle cx="3.5" cy="6" r="1.2" />
          <circle cx="8.5" cy="6" r="1.2" />
          <circle cx="3.5" cy="10" r="1.2" />
          <circle cx="8.5" cy="10" r="1.2" />
        </svg>
      </button>
      <span className="item-label">{name}</span>
      <button
        className="remove-btn"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="4" y1="4" x2="10" y2="10" />
          <line x1="10" y1="4" x2="4" y2="10" />
        </svg>
      </button>
    </li>
  );
}

function SortableList({
  label,
  values,
  setValues,
  allOptions,
}: {
  label: string;
  values: string[] | undefined;
  setValues: (next: string[]) => void;
  allOptions: ModuleOption[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [customId, setCustomId] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const currentIds = useMemo(() => new Set(values ?? []), [values]);
  const available = useMemo(
    () => allOptions.filter((o) => !currentIds.has(o.id)),
    [allOptions, currentIds]
  );

  const nameOf = useCallback(
    (id: string) => allOptions.find((o) => o.id === id)?.name ?? id,
    [allOptions]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !values) return;
      const oldIndex = values.indexOf(active.id as string);
      const newIndex = values.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      setValues(arrayMove(values, oldIndex, newIndex));
    },
    [values, setValues]
  );

  const removeAt = useCallback(
    (index: number) => {
      if (!values) return;
      setValues(values.filter((_, i) => i !== index));
    },
    [setValues, values]
  );

  const add = useCallback(
    (id: string) => {
      setValues([...(values ?? []), id]);
    },
    [setValues, values]
  );

  const addCustom = useCallback(() => {
    const id = customId.trim();
    if (!id) return;
    setValues([...(values ?? []), id]);
    setCustomId("");
  }, [customId, setValues, values]);

  const items = values ?? [];

  const plusIcon = (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="7" y1="3" x2="7" y2="11" />
      <line x1="3" y1="7" x2="11" y2="7" />
    </svg>
  );

  return (
    <fieldset className="config-section">
      <legend className="section-label">{label}</legend>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="sortable-list">
            {items.map((id, index) => (
              <SortableItem
                key={id}
                id={id}
                name={nameOf(id)}
                onRemove={() => removeAt(index)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {showAdd ? (
        <div className="add-menu">
          {available.map((opt) => (
            <button
              key={opt.id}
              className="add-option"
              onClick={() => add(opt.id)}
            >
              {plusIcon}
              {opt.name}
            </button>
          ))}
          <div className="add-custom">
            <input
              type="text"
              className="add-custom-input"
              placeholder="tool-id"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
            />
            <button
              className="add-custom-btn"
              onClick={addCustom}
              disabled={!customId.trim()}
            >
              {plusIcon}
            </button>
          </div>
          <button
            className="add-cancel"
            onClick={() => {
              setShowAdd(false);
              setCustomId("");
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <button className="add-btn" onClick={() => setShowAdd(true)}>
          {plusIcon}
          Add
        </button>
      )}
    </fieldset>
  );
}

function SingleSelect({
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
  if (options.length === 0) {
    return (
      <fieldset className="config-section">
        <legend className="section-label">{label}</legend>
        <p className="empty-message">No tools available</p>
      </fieldset>
    );
  }

  return (
    <fieldset className="config-section">
      <legend className="section-label">{label}</legend>
      <div className="radio-group">
        {options.map((opt) => (
          <label key={opt.id} className="radio-option">
            <input
              type="radio"
              name={label}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <span>{opt.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
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

  const allTools = useToolDescriptions();

  const frameOptions = useMemo(
    () =>
      allTools
        .filter((t) => (t.tags ?? []).includes("frame-tool"))
        .map((t) => ({ id: t.id, name: t.name || t.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

  const sidebarOptions = useMemo(
    () =>
      allTools
        .filter((t) => (t.tags ?? []).includes("sidebar-account"))
        .map((t) => ({ id: t.id, name: t.name || t.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

  const contextSidebarOptions = useMemo(
    () =>
      allTools
        .filter((t) => (t.tags ?? []).includes("sidebar-context"))
        .map((t) => ({ id: t.id, name: t.name || t.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

  const documentToolbarOptions = useMemo(
    () =>
      allTools
        .filter((t) => (t.tags ?? []).includes("titlebar-tool"))
        .map((t) => ({ id: t.id, name: t.name || t.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

  const contextToolOptions = useMemo(
    () =>
      allTools
        .filter((t) => (t.tags ?? []).includes("context-tool"))
        .map((t) => ({ id: t.id, name: t.name || t.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTools]
  );

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
        const arr = (doc as any)[key];
        arr.splice(0, arr.length, ...next);
      });
    },
    [changeAccountDoc]
  );

  if (!accountDoc) {
    return <div className="configurator loading">Loading configuration…</div>;
  }

  return (
    <div className="configurator">
      <h2 className="configurator-title">Frame Configurator</h2>

      <SingleSelect
        label="Frame Tool"
        value={accountDoc.frameToolId}
        onChange={(v) => {
          setField("frameToolId", v as any);
          setTimeout(() => window.location.reload(), 50);
        }}
        options={frameOptions}
      />

      <SingleSelect
        label="Account Sidebar"
        value={accountDoc.accountSidebarToolId}
        onChange={(v) => setField("accountSidebarToolId", v as any)}
        options={sidebarOptions}
      />

      <SingleSelect
        label="Context Sidebar"
        value={accountDoc.contextSidebarToolId}
        onChange={(v) => setField("contextSidebarToolId", v as any)}
        options={contextSidebarOptions}
      />

      <SortableList
        label="Toolbar"
        values={accountDoc.documentToolbarToolIds}
        setValues={(next) => setArrayField("documentToolbarToolIds", next)}
        allOptions={documentToolbarOptions}
      />

      <SortableList
        label="Context Tools"
        values={accountDoc.contextToolIds}
        setValues={(next) => setArrayField("contextToolIds", next)}
        allOptions={contextToolOptions}
      />
    </div>
  );
}
