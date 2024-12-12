import React, { useEffect, useMemo, useRef, useState } from "react";
import { AmbPokerDoc } from "../datatype";
import { Model, SAMPLE_MODEL, Scenario, Card, isCard } from "../model";
import { Engine, FilteredScenario } from "../engine";
import { valueViewers } from "../valueViewers";
import { Button } from "@patchwork/sdk/ui/button";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps } from "@patchwork/sdk";
import background from "../background.png";

// when this gets to 50k+, aggregation gets slow
const DEFAULT_MAX_SCENARIOS = 10000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame
const UPDATE_VIEW_EVERY_MS = 100; // update the UI every __ ms (too often and rendering gets expensive)

// We don't use the automerge doc for anything yet.
// Once the model is properly editable it'll be in the automerge doc.
export const AmbPoker: React.FC<EditorProps<AmbPokerDoc, string>> = ({}) => {
  const [model, setModel] = useState<Model>(SAMPLE_MODEL);
  const scenariosRef = React.useRef<FilteredScenario[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0); // For triggering re-renders
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [maxScenarios, setMaxScenarios] = useState(DEFAULT_MAX_SCENARIOS);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const totalComputeTime = useRef(0);

  useEffect(() => {
    const engine = new Engine(model, (filteredScenario) =>
      scenariosRef.current.push(filteredScenario)
    );
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
  }, [model, maxScenarios]);

  useEffect(() => {
    scenariosRef.current = [];
  }, [model]);

  const rows = [
    { label: "Theirs", values: ["theirCard1", "theirCard2"] },
    {
      label: "Community",
      values: ["commCard1", "commCard2", "commCard3", "commCard4", "commCard5"],
    },
    { label: "Mine", values: ["myCard1", "myCard2"] },
    { label: "Stats", values: ["myHand", "theirHand", "iWin"] },
  ];

  if (!scenariosRef.current) {
    return <div>Loading...</div>;
  }

  let filteredScenariosCount = 0;
  for (const scenario of scenariosRef.current) {
    if (scenario.include) {
      filteredScenariosCount++;
    }
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
        className="flex-1 flex flex-col overflow-hidden bg-cover bg-center bg-repeat text-white"
        style={{
          backgroundImage: `url(${background})`,
        }}
      >
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
                              const filteredValues = scenariosRef.current.map(
                                ({ scenario, include }) => ({
                                  value: scenario[name],
                                  include,
                                })
                              );
                              const viewer = valueViewers.find(
                                (v) => v.shouldRender(filteredValues) !== "hide"
                              );
                              if (viewer) {
                                return viewer.component({
                                  values: filteredValues,
                                });
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

      <div className="bg-[#003300] text-white w-80 border-l flex-shrink-0 overflow-hidden flex flex-col gap-4">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <div className="space-y-2">
                {/* <input
                  type="range"
                  min={0}
                  max={Math.max(0, scenarioCount - 1)}
                  value={selectedScenarioIndex}
                  onChange={(e) =>
                    setSelectedScenarioIndex(parseInt(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-600">
                  Viewing scenario {selectedScenarioIndex + 1} of{" "}
                  {scenarioCount}
                </div> */}
                <div className="text-sm text-white">
                  {scenarioCount} scenarios enumerated in{" "}
                  {totalComputeTime.current.toFixed(0)}ms
                  <br />(
                  {((scenarioCount / totalComputeTime.current) * 1000).toFixed(
                    0
                  )}{" "}
                  scenarios/s)
                </div>

                <div className="text-sm text-blue-300">
                  (filtered down to {filteredScenariosCount} scenarios)
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm space-y-2">
                <Button
                  onClick={() => {
                    setMaxScenarios(maxScenarios * 2);
                  }}
                  variant="default"
                  className="w-full"
                >
                  Generate more (up to {maxScenarios * 2})
                </Button>
              </div>
            </div>

            {selectedValue && (
              <div className="flex flex-col gap-6 border-t border-gray-400 pt-4">
                <div className="text-md text-white font-medium">
                  {selectedValue}
                </div>
                {(() => {
                  const filteredValues = scenariosRef.current.map(
                    ({ scenario, include }) => ({
                      value: scenario[selectedValue],
                      include,
                    })
                  );
                  const viewers = valueViewers.filter(
                    (v) => v.shouldRender(filteredValues) !== "hide"
                  );
                  return viewers.map((viewer) => (
                    <div key={viewer.name}>
                      <div className="text-sm text-white">{viewer.name}</div>
                      <div className="p-1 text-lg rounded relative">
                        {viewer.component({
                          values: filteredValues,
                        })}
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
