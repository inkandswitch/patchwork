import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import React, { useEffect, useMemo, useState } from "react";
import { AmbPokerDoc } from "./datatype";
import { Engine, Model, SAMPLE_MODEL, Scenario } from "./poker";

// when this gets to 100k+, something gets slow...
const MAX_SCENARIOS = 20000;
const MAX_MS_FOR_SCENARIO_GEN_PER_FRAME = 4; // how many ms do we spend generating scenarios per frame

export const AmbPoker: React.FC<EditorProps<AmbPokerDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument(docUrl);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [model, setModel] = useState<Model>(SAMPLE_MODEL);
  const scenariosRef = React.useRef<Scenario[]>([]);
  const [scenarioCount, setScenarioCount] = useState(0); // For triggering re-renders

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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Model</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(model.cells).map(([name, value]) => (
            <div key={name} className="p-3 border rounded">
              <div className="text-sm text-gray-600">{name}</div>
              <div className="font-mono">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Evaluation Progress</h2>

        <div className="text-sm text-gray-600 mt-1">
          {scenarioCount} / {MAX_SCENARIOS} scenarios generated
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
