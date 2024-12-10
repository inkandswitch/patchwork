import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import React, { useEffect, useMemo, useState } from "react";
import { AmbPokerDoc } from "./datatype";
import { Engine, Model, SAMPLE_MODEL, Scenario, Card, isCard } from "./poker";
import { bestHand } from "./handEvaluation";
import { CardComponent } from "./components/Card";
import { Hand } from "./components/Hand";

// when this gets to 100k+, something gets slow...
const MAX_SCENARIOS = 20000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame

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

  const myBestHand = activeScenario
    ? bestHand([
        activeScenario["myCard1"] as Card,
        activeScenario["myCard2"] as Card,
        activeScenario["communityCard1"] as Card,
        activeScenario["communityCard2"] as Card,
        activeScenario["communityCard3"] as Card,
        activeScenario["communityCard4"] as Card,
        activeScenario["communityCard5"] as Card,
      ])
    : null;

  const theirBestHand = activeScenario
    ? bestHand([
        activeScenario["theirCard1"] as Card,
        activeScenario["theirCard2"] as Card,
        activeScenario["communityCard1"] as Card,
        activeScenario["communityCard2"] as Card,
        activeScenario["communityCard3"] as Card,
        activeScenario["communityCard4"] as Card,
        activeScenario["communityCard5"] as Card,
      ])
    : null;

  const iWin = myBestHand && theirBestHand && myBestHand.beats(theirBestHand);

  const rows = [
    { label: "Mine", cards: ["myCard1", "myCard2"] },
    {
      label: "Community",
      cards: [
        "communityCard1",
        "communityCard2",
        "communityCard3",
        "communityCard4",
        "communityCard5",
      ],
    },
    { label: "Theirs", cards: ["theirCard1", "theirCard2"] },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Model</h2>
        <div className="flex flex-col gap-4">
          {rows.map(({ label, cards }, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-24 text-sm text-gray-600 font-medium">
                {label}:
              </div>
              <div className="flex gap-4 justify-center">
                {cards.map((name) => {
                  const value = model.cells[name];
                  return (
                    <div
                      key={name}
                      className={`p-3 ${
                        value === "?" ? "bg-gray-100" : "border"
                      } rounded relative`}
                    >
                      {value === "?" && (
                        <div className="absolute top-1 right-2 text-gray-500">
                          ?
                        </div>
                      )}
                      <div className="text-sm text-gray-600 font-mono">
                        {name}
                      </div>
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className=" flex flex-col gap-4">
          <div className="flex gap-4 items-center h-12">
            <div className="w-24 text-sm text-gray-600 font-medium">
              My hand:
            </div>
            {myBestHand ? <Hand hand={myBestHand} /> : "N/A"}
          </div>
          <div>
            <div className="flex gap-4 items-center h-12">
              <div className="w-24 text-sm text-gray-600 font-medium">
                Their hand:
              </div>
              {theirBestHand ? <Hand hand={theirBestHand} /> : "N/A"}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {iWin ? "I win! 🎉" : "I lose 😢"}
          </div>
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
