import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AmbPokerDoc } from "./datatype";
import { Model, SAMPLE_MODEL, Scenario, Card, isCard } from "./model";
import { Engine } from "./engine";
import { PokerHand } from "./handEvaluation";
import { valueViewers } from "./valueViewers";
import { Button } from "@patchwork/sdk/ui/button";

// when this gets to 100k+, something gets slow...
const DEFAULT_MAX_SCENARIOS = 20000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame
const UPDATE_VIEW_EVERY_MS = 100;

export const AmbPoker: React.FC<EditorProps<AmbPokerDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument(docUrl);
  const [model, setModel] = useState<Model>(SAMPLE_MODEL);
  const scenariosRef = React.useRef<Scenario[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0); // For triggering re-renders
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [maxScenarios, setMaxScenarios] = useState(DEFAULT_MAX_SCENARIOS);

  const totalComputeTime = useRef(0);

  useEffect(() => {
    const engine = new Engine(model, (scenario) => {
      scenariosRef.current.push(scenario);
    });
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
    { label: "Theirs", values: ["theirCard1", "theirCard2", "theirHand"] },
    {
      label: "Community",
      values: [
        "communityCard1",
        "communityCard2",
        "communityCard3",
        "communityCard4",
        "communityCard5",
      ],
    },
    { label: "Mine", values: ["myCard1", "myCard2", "myHand"] },
    { label: "I win", values: ["iWin"] },
  ];

  const handTypeCounts = new Map<string, number>();
  for (const scenario of scenariosRef.current) {
    const type = (scenario.myHand as PokerHand).type;
    handTypeCounts.set(type, (handTypeCounts.get(type) ?? 0) + 1);
  }

  if (!scenariosRef.current) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Model</h2>
        <div className="flex flex-col gap-4">
          {rows.map(({ label, values }, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-24 text-sm text-gray-600 font-medium">
                {label}:
              </div>
              <div className="flex gap-4 justify-center">
                {values.map((name) => {
                  const value = model.cells[name];
                  return (
                    <div key={name}>
                      {value === "?" && (
                        <div className="absolute top-1 right-2 text-gray-500">
                          ?
                        </div>
                      )}
                      <div className="text-sm text-gray-600 font-mono">
                        {name}
                      </div>
                      <div
                        className={`text-lg p-3 ${
                          value === "?" ? "bg-gray-100" : "border"
                        } rounded relative`}
                      >
                        {(() => {
                          const ambValue = scenariosRef.current.map(
                            (scenario) => scenario[name]
                          );
                          const filteredValues = ambValue.map((v) => ({
                            value: v,
                            include: true,
                          }));
                          const viewer = valueViewers.find(
                            (v) => v.shouldRender(filteredValues) !== "hide"
                          );
                          if (viewer) {
                            return viewer.component({ values: filteredValues });
                          } else {
                            return "noviewer";
                          }
                        })()}
                        {/* return <CardViewer card={cardValue} />;
                          } else if (cardValue instanceof PokerHand) {
                            return <HandViewer hand={cardValue} />;
                          }

                          return cardValue; */}
                        {/* })()} */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Pick a scenario</h2>
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={Math.max(0, scenarioCount - 1)}
            value={selectedScenarioIndex}
            onChange={(e) => setSelectedScenarioIndex(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600">
            Viewing scenario {selectedScenarioIndex + 1} of {scenarioCount}
          </div>
          <div>
            {(() => {
              if (!scenariosRef.current) {
                return <div></div>;
              }

              return [...handTypeCounts.entries()].map(([type, count]) => {
                return (
                  <div>
                    {type} {((100 * count) / scenarioCount).toFixed(2)}%
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <div className="p-4 text-xs text-gray-500">
        {scenarioCount} scenarios enumerated in{" "}
        {totalComputeTime.current.toFixed(0)}ms of active compute time. (
        {((scenarioCount / totalComputeTime.current) * 1000).toFixed(0)}{" "}
        scenarios/s)
      </div>

      <div className="p-4 text-xs">
        <div>Scenario count limit: {maxScenarios}</div>
        <Button
          onClick={() => {
            setMaxScenarios(maxScenarios * 2);
          }}
          variant="default"
        >
          Raise limit to {maxScenarios * 2}
        </Button>
      </div>
    </div>
  );
};

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambPoker",
  name: "Amb Poker",
  supportedDataTypes: ["ambPoker"],
  EditorComponent: AmbPoker,
});
