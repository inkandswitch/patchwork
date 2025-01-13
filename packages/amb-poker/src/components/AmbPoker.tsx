import React, { useEffect, useMemo, useRef, useState } from "react";
import { AmbPokerDoc } from "../datatype";
import { Model, SAMPLE_MODEL, Scenario, Card, isCard } from "../model";
import { Engine } from "../engine";
import { ValueViewerProps, valueViewers } from "../valueViewers";
import { Button } from "@patchwork/sdk/ui/button";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps } from "@patchwork/sdk";
import background from "../background.png";
import { formatPercentage } from "../valueViewers/aggregate";

// when this gets to 50k+, aggregation gets slow
const DEFAULT_MAX_SCENARIOS = 10000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame
const UPDATE_VIEW_EVERY_MS = 100; // update the UI every __ ms (too often and rendering gets expensive)

// We don't use the automerge doc for anything yet.
// Once the model is properly editable it'll be in the automerge doc.
export const AmbPoker: React.FC<EditorProps<AmbPokerDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument<AmbPokerDoc>(docUrl);
  const scenariosRef = React.useRef<Scenario[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0); // For triggering re-renders
  const [maxScenarios, setMaxScenarios] = useState(DEFAULT_MAX_SCENARIOS);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const totalComputeTime = useRef(0);

  // Add temporary state for inputs
  const [tempSelectedValueText, setTempSelectedValueText] = useState("");

  // Add new state for temporary name editing
  const [tempCellName, setTempCellName] = useState("");

  // Add new state for mouse position
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Add new state for drag tracking
  const [dragState, setDragState] = useState<{
    cellName: string;
    offsetX: number;
    offsetY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  useEffect(() => {
    if (doc?.model && selectedValue) {
      const cell = doc.model.cells.find((c) => c.name === selectedValue);
      setTempCellName(cell?.name || "");
      setTempSelectedValueText(cell?.formula || "");
    }
  }, [doc?.model, selectedValue]);

  useEffect(() => {
    if (!doc || !doc.model) return;
    scenariosRef.current = [];
    let engine;
    try {
      engine = new Engine(doc.model, (filteredScenario) =>
        scenariosRef.current.push(filteredScenario)
      );
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setError(null);
    let lastUpdatedView = performance.now();
    totalComputeTime.current = 0;

    const frame = () => {
      const start = performance.now();
      let iterationsPerFrame = 0;
      while (performance.now() - start < MAX_MS_FOR_SCENARIO_GEN_PER_FRAME) {
        engine.next();
        iterationsPerFrame++;
      }
      totalComputeTime.current += performance.now() - start;

      // Only update the view occasionally - this avoids re-rendering too much which can get slow
      if (performance.now() - lastUpdatedView > UPDATE_VIEW_EVERY_MS) {
        setScenarioCount(scenariosRef.current.length);
        lastUpdatedView = performance.now();
      }

      if (scenariosRef.current.length < maxScenarios) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }, [doc?.model, maxScenarios]);

  const rows = [
    { label: "Theirs", values: ["theirCard1", "theirCard2"] },
    {
      label: "Community",
      values: ["commCard1", "commCard2", "commCard3", "commCard4", "commCard5"],
    },
    { label: "Mine", values: ["myCard1", "myCard2"] },
    {
      label: "Stats",
      values: ["myHand", "theirHand", "iWin", "theyHaveAPair", "iHaveAPair"],
    },
  ];

  const handleCanvasClick = (e: React.MouseEvent) => {
    console.log("click", e.target);
    // If we clicked on the main content area (not a cell)
    if ((e.target as HTMLElement).classList.contains("cell-canvas")) {
      // Get click coordinates relative to the container
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Generate new cell name
      const cellNumber = doc?.model.cells.length || 0;
      const newCellName = `cell${cellNumber + 1}`;

      console.log("click", { x, y, newCellName });

      // Add new cell to the model
      changeDoc((d) => {
        d.model.cells.push({
          name: newCellName,
          formula: "=deal()",
          position: { x, y },
        });
      });

      e.stopPropagation();
    }
    setSelectedValue(null);
  };

  // Add mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    // Only show tooltip if we're directly over the canvas
    if ((e.target as HTMLElement).classList.contains("cell-canvas")) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setMousePos(null);
    }
  };

  // Add mouse leave handler
  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Add mouse handlers for dragging
  const handleDragStart = (e: React.MouseEvent, cell: Model["cells"][0]) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragState({
      cellName: cell.name,
      offsetX,
      offsetY,
      currentX: cell.position.x,
      currentY: cell.position.y,
    });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (dragState) {
      const rect = (e.target as HTMLElement)
        .closest(".cell-canvas")
        ?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - dragState.offsetX;
        const y = e.clientY - rect.top - dragState.offsetY;

        setDragState({
          ...dragState,
          currentX: x,
          currentY: y,
        });
      }
    }
  };

  const handleDragEnd = () => {
    if (dragState) {
      changeDoc((doc) => {
        const cell = doc.model.cells.find((c) => c.name === dragState.cellName);
        if (cell) {
          cell.position.x = dragState.currentX;
          cell.position.y = dragState.currentY;
        }
      });
      setDragState(null);
    }
  };

  if (
    !doc ||
    !doc.model ||
    !scenariosRef.current ||
    scenariosRef.current.length === 0
  ) {
    return <div>Loading...</div>;
  }

  console.log({ scenariosRef: scenariosRef.current });
  return (
    <div
      className="flex h-full overflow-hidden"
      onClick={() => {
        setSelectedValue(null);
      }}
    >
      {/* Main content area */}
      <div
        className="flex-1 flex flex-col overflow-hidden bg-cover bg-center bg-repeat text-white relative"
        style={{
          backgroundImage: `url(${background})`,
        }}
        onMouseMove={dragState ? handleDragMove : handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => {
          handleDragEnd();
          handleMouseLeave();
        }}
      >
        {error && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-lg">
              {error}
            </div>
          </div>
        )}
        {/* Stats overlay in top right */}
        <div className="absolute top-4 right-8 w-72 bg-[#000000] bg-opacity-50 p-4">
          <div className="space-y-4">
            <div className="text-sm text-white">
              {scenarioCount} scenarios in {totalComputeTime.current.toFixed(0)}
              ms (
              {((scenarioCount / totalComputeTime.current) * 1000).toFixed(
                0
              )}{" "}
              /s)
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div>Filters:</div>
                <select
                  className="bg-black bg-opacity-50 text-white text-sm rounded px-2 py-1 border border-gray-600"
                  onChange={(e) => {
                    if (e.target.value) {
                      changeDoc((d) => {
                        if (!d.model.filters.includes(e.target.value)) {
                          d.model.filters.push(e.target.value);
                        }
                      });
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Add filter...</option>
                  {Object.keys(scenariosRef.current[0] || {}).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {doc.model.filters.map((filter, index) => (
                <div key={filter} className="flex justify-between items-start">
                  <div>
                    <div className="font-mono">{filter}</div>
                    <div className="text-xs text-gray-300">
                      ( matched{" "}
                      {formatPercentage(
                        (scenariosRef.current.filter((s) => s[filter]).length *
                          100) /
                          scenariosRef.current.length
                      )}{" "}
                      of scenarios )
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      changeDoc((d) => {
                        d.model.filters.splice(index, 1);
                      });
                    }}
                    className="text-gray-400 hover:text-white px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto cell-canvas cursor-pointer"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {doc.model.cells.map((cell) => {
                const isDragging = dragState?.cellName === cell.name;
                return (
                  <div
                    key={cell.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedValue(cell.name);
                    }}
                    style={{
                      position: "absolute",
                      left: isDragging ? dragState.currentX : cell.position.x,
                      top: isDragging ? dragState.currentY : cell.position.y,
                    }}
                    className={`p-1 rounded-md ${
                      selectedValue === cell.name
                        ? "bg-blue-500 bg-opacity-40 border border-white box-border"
                        : "border border-transparent"
                    }`}
                  >
                    {/* Add drag handle */}
                    <div
                      className="absolute -left-1 -top-1 w-4 h-4 bg-gray-700 hover:bg-gray-600 rounded cursor-move flex items-center justify-center"
                      onMouseDown={(e) => handleDragStart(e, cell)}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-sm" />
                    </div>

                    <div className="text-sm mb-1 text-white font-mono">
                      {cell.name}
                    </div>
                    <div
                      className={`p-1 text-lg max-h-64 overflow-hidden overflow-y-auto rounded relative`}
                    >
                      {(() => {
                        const viewerProps: ValueViewerProps = {
                          scenarios: scenariosRef.current,
                          cellToDisplay: cell.name,
                          filters: doc.model.filters.filter(
                            (f) => f !== cell.name
                          ),
                        };

                        // First try to use the default viewer if set
                        if (cell.defaultViewer) {
                          const defaultViewer = valueViewers.find(
                            (v) => v.name === cell.defaultViewer
                          );
                          if (
                            defaultViewer &&
                            defaultViewer.shouldRender(viewerProps) !== "hide"
                          ) {
                            return defaultViewer.component(viewerProps);
                          }
                        }

                        // Fall back to auto-selection if no default or if default is not available
                        const viewer = valueViewers.find(
                          (v) => v.shouldRender(viewerProps) !== "hide"
                        );
                        if (viewer) {
                          return viewer.component(viewerProps);
                        } else {
                          return "noviewer";
                        }
                      })()}
                    </div>
                  </div>
                );
              })}

              {/* Add new cell tooltip */}
              {mousePos && (
                <div
                  style={{
                    position: "absolute",
                    left: mousePos.x,
                    top: mousePos.y + 12, // offset below cursor
                    pointerEvents: "none", // prevent tooltip from interfering with clicks
                  }}
                  className="bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded-md whitespace-nowrap"
                >
                  + Add new cell
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-[#003300] text-white w-80 border-l flex-shrink-0 overflow-hidden flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {!selectedValue && (
              <div className="text-xs text-gray-300 flex items-center justify-center h-full">
                No cell selected
              </div>
            )}
            {selectedValue && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-2">
                    <textarea
                      className="w-full bg-black bg-opacity-30 text-white p-2 rounded text-md font-medium resize-none"
                      value={tempCellName}
                      onChange={(e) => setTempCellName(e.target.value)}
                      onBlur={() => {
                        if (tempCellName.trim() !== selectedValue) {
                          changeDoc((doc) => {
                            const cell = doc.model.cells.find(
                              (c) => c.name === selectedValue
                            );
                            if (cell) {
                              cell.name = tempCellName.trim();
                            }
                          });
                          setSelectedValue(tempCellName.trim());
                        }
                      }}
                      rows={1}
                    />
                  </div>
                  <button
                    onClick={() => {
                      changeDoc((doc) => {
                        const index = doc.model.cells.findIndex(
                          (c) => c.name === selectedValue
                        );
                        if (index !== -1) {
                          doc.model.cells.splice(index, 1);
                        }
                      });
                      setSelectedValue(null);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div>
                  <div className="text-sm text-white mb-2">Formula</div>
                  <textarea
                    className="w-full bg-black bg-opacity-30 text-white p-2 rounded"
                    value={tempSelectedValueText}
                    onChange={(e) => setTempSelectedValueText(e.target.value)}
                    onBlur={(e) => {
                      changeDoc((doc) => {
                        const cell = doc.model.cells.find(
                          (c) => c.name === selectedValue
                        );
                        if (cell) {
                          cell.formula = tempSelectedValueText;
                        }
                      });
                    }}
                  />
                </div>

                {/* Add default viewer selector */}
                <div>
                  <div className="text-sm text-white mb-2">Default Viewer</div>
                  <select
                    className="w-full bg-black bg-opacity-30 text-white p-2 rounded border border-gray-600"
                    value={
                      doc.model.cells.find((c) => c.name === selectedValue)
                        ?.defaultViewer || ""
                    }
                    onChange={(e) => {
                      changeDoc((doc) => {
                        const cell = doc.model.cells.find(
                          (c) => c.name === selectedValue
                        );
                        if (cell) {
                          if (e.target.value === "") {
                            delete cell.defaultViewer;
                          } else {
                            cell.defaultViewer = e.target.value;
                          }
                        }
                      });
                    }}
                  >
                    <option value="">Auto-select viewer</option>
                    {(() => {
                      const viewerProps: ValueViewerProps = {
                        scenarios: scenariosRef.current,
                        cellToDisplay: selectedValue!,
                        filters: doc.model.filters.filter(
                          (f) => f !== selectedValue
                        ),
                      };
                      return valueViewers
                        .filter((v) => v.shouldRender(viewerProps) !== "hide")
                        .map((viewer) => (
                          <option key={viewer.name} value={viewer.name}>
                            {viewer.name}
                          </option>
                        ));
                    })()}
                  </select>
                </div>

                {(() => {
                  const viewerProps: ValueViewerProps = {
                    scenarios: scenariosRef.current,
                    cellToDisplay: selectedValue,
                    filters: doc.model.filters.filter(
                      (f) => f !== selectedValue
                    ),
                  };
                  const viewers = valueViewers.filter(
                    (v) => v.shouldRender(viewerProps) !== "hide"
                  );
                  return viewers.map((viewer) => (
                    <div key={viewer.name}>
                      <div className="text-sm text-white">{viewer.name}</div>
                      <div className="p-1 text-lg rounded relative">
                        {viewer.component(viewerProps)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
