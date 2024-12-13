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

  useEffect(() => {
    if (doc?.model && selectedValue) {
      setTempSelectedValueText(doc.model.cells[selectedValue] || "");
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
      values: [
        "myHand",
        "theirHand",
        "iWin",
        "I have a straight",
        "I have a pair",
      ],
    },
  ];

  if (
    !doc ||
    !doc.model ||
    !scenariosRef.current ||
    scenariosRef.current.length === 0
  ) {
    return <div>Loading...</div>;
  }

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
              Filters:
              {doc.model.filters.map((filter) => (
                <div key={filter}>
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
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {rows.map(({ label, values }, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-24 text-sm text-white font-medium">
                    {label}:
                  </div>
                  <div className="flex gap-4 justify-center">
                    {values.map((name) => {
                      return (
                        <div
                          key={name}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedValue(name);
                          }}
                          className={`relative p-1 cursor-pointer rounded-md ${
                            selectedValue === name
                              ? "bg-blue-500 bg-opacity-40 border border-white box-border"
                              : "border border-transparent"
                          }`}
                        >
                          <div className="text-sm mb-1 text-white font-mono">
                            {name}
                          </div>
                          <div
                            className={`p-1 text-lg max-h-64 overflow-hidden overflow-y-auto rounded relative`}
                          >
                            {(() => {
                              const viewerProps: ValueViewerProps = {
                                scenarios: scenariosRef.current,
                                cellToDisplay: name,
                                filters: doc.model.filters.filter(
                                  (f) => f !== name
                                ),
                              };

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
                  </div>
                </div>
              ))}
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
                <div className="text-md text-white font-medium">
                  {selectedValue}
                </div>

                <div>
                  <div className="text-sm text-white mb-2">Formula</div>
                  <textarea
                    className="w-full bg-black bg-opacity-30 text-white p-2 rounded"
                    value={tempSelectedValueText}
                    onChange={(e) => setTempSelectedValueText(e.target.value)}
                    onBlur={(e) => {
                      changeDoc((doc) => {
                        doc.model.cells[selectedValue] = tempSelectedValueText;
                      });
                    }}
                  />
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
