import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import React, { useEffect, useMemo, useState } from "react";
import { AmbPokerDoc } from "./datatype";
import { Engine, Model, SAMPLE_MODEL, Scenario, Card, isCard } from "./poker";

// when this gets to 100k+, something gets slow...
const MAX_SCENARIOS = 20000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame

const CardComponent: React.FC<{ card: Card }> = ({ card }) => {
  const rank = card[0];
  const suit = card[1];
  const displayRank = rank === "T" ? "10" : rank;
  const suitEmoji =
    {
      H: "♥️",
      D: "♦️",
      C: "♣️",
      S: "♠️",
    }[suit] || suit;

  return (
    <span className="flex items-center gap-1">
      <span>{displayRank}</span>
      <span>{suitEmoji}</span>
    </span>
  );
};

export const AmbPoker: React.FC<EditorProps<AmbPokerDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument(docUrl);
  const [model, setModel] = useState<Model>(SAMPLE_MODEL);
  const scenariosRef = React.useRef<Scenario[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0); // For triggering re-renders
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);

  useEffect(() => {
    scenariosRef.current = [];
    const engine = new Engine(model, (scenario) => {
      scenariosRef.current.push(scenario);
    });

    const frame = () => {
      const start = performance.now();
      let iterationsPerFrame = 0;
      while (performance.now() - start < MAX_MS_FOR_SCENARIO_GEN_PER_FRAME) {
        engine.next();
        iterationsPerFrame++;
      }
      // occasionally report the rate of scenario generation
      if (Math.random() < 0.001) {
        console.log(
          `Generated ${iterationsPerFrame} scenarios in ${
            performance.now() - start
          }ms`
        );
      }
      setScenarioCount(scenariosRef.current.length); // Trigger re-render after batch
      if (scenariosRef.current.length < MAX_SCENARIOS) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }, [model]);

  const activeScenario = scenariosRef.current[selectedScenarioIndex];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Model</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(model.cells).map(([name, value]) => (
            <div
              key={name}
              className={`p-3 ${
                value === "?" ? "bg-gray-100" : "border"
              } rounded relative`}
            >
              {value === "?" && (
                <div className="absolute top-1 right-2 text-gray-500">?</div>
              )}
              <div className="text-sm text-gray-600 font-mono">{name}</div>
              <div className="text-2xl">
                {(() => {
                  const cardValue =
                    activeScenario && value === "?"
                      ? activeScenario[name]
                      : value;
                  if (isCard(cardValue)) {
                    return <CardComponent card={cardValue} />;
                  }
                  return cardValue;
                })()}
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
        </div>
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
