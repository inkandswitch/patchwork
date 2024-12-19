import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { Doc } from "./datatype";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Code, ArrowRight } from "lucide-react";

// Helper to format a clause in Prolog syntax
const formatClause = (clause) => {
  if (!clause.args || clause.args.length === 0) return clause.name;
  const args = clause.args
    .map((arg) => {
      if (!arg.args) return arg.name; // It's a variable
      return formatClause(arg); // It's a compound term
    })
    .join(", ");
  return `${clause.name}(${args})`;
};

// Helper to format a rule in Prolog syntax
const formatRule = (rule) => {
  const head = formatClause(rule.head);
  if (!rule.body || rule.body.length === 0) {
    return `${head}.`;
  }
  const body = rule.body.map(formatClause).join(", ");
  return `${head} :- ${body}.`;
};

const Timeline = ({ data, currentStep, onStepSelect }) => {
  const stepWidth = `${100 / data.stack.length}%`;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
      <div className="text-sm opacity-70">Timeline:</div>
      <div className="flex h-6 gap-px">
        {data.stack.map((snapshot, idx) => (
          <button
            key={idx}
            onClick={() => onStepSelect(idx)}
            className={`h-full ${
              idx === currentStep
                ? "bg-green-500"
                : snapshot.solution
                ? snapshot.solution.repeated
                  ? "bg-red-900 hover:bg-red-800"
                  : "bg-green-900 hover:bg-green-800"
                : "bg-green-900/30 hover:bg-green-900/50"
            } transition-colors`}
            style={{ width: stepWidth }}
            title={`Step ${idx + 1}${
              snapshot.solution
                ? snapshot.solution.repeated
                  ? " (Repeated solution)"
                  : " (Solution found)"
                : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const PrologDebugger: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const [currentStep, setCurrentStep] = useState(0);
  const [jsonInput, setJsonInput] = useState("");
  const [hoveredRule, setHoveredRule] = useState<number | null>(null);

  const handleJsonParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      changeDoc((d) => {
        d.trace = parsed;
      });
      setCurrentStep(0);
    } catch (err) {
      alert("Invalid JSON");
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    if (!doc?.trace) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentStep((prev) =>
          Math.min(doc.trace!.stack.length - 1, prev + 1)
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doc?.trace]);

  if (!doc) return null;

  if (!doc.trace) {
    return (
      <div className="min-h-screen bg-black text-green-500 p-4 font-mono">
        <div className="max-w-4xl mx-auto">
          <textarea
            className="w-full h-64 bg-black border border-green-500 text-green-500 p-2 focus:outline-none focus:border-green-300"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
          />
          <button
            onClick={handleJsonParse}
            className="mt-2 px-4 py-1 border border-green-500 hover:bg-green-500 hover:text-black transition-colors"
          >
            Initialize Debugger
          </button>
        </div>
      </div>
    );
  }

  const currentSnapshot = doc.trace.stack[currentStep];
  const activeFrame = currentSnapshot.stack[currentSnapshot.stack.length - 1];
  const activeRuleIndex = activeFrame?.ruleIndex;

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 font-mono">
      <div className="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* Left Column - Program */}
        <div className="border border-green-500 p-2">
          <div className="text-sm mb-2 flex items-center gap-2">
            <Code size={16} /> Program
          </div>

          <div className="space-y-0">
            {doc.trace.prog.rules.map((rule, idx) => (
              <div
                key={idx}
                className={`px-2 py-1 transition-colors ${
                  idx === activeRuleIndex
                    ? "bg-green-900 border-l-4 border-green-400"
                    : hoveredRule === idx
                    ? "bg-green-900/50"
                    : ""
                }`}
              >
                {formatRule(rule)}
              </div>
            ))}
          </div>

          <div className="mt-2 px-2 py-1 border-t border-green-500">
            {doc.trace.prog.query.map(formatClause).join(", ")}?
          </div>
        </div>

        {/* Right Column - Stack (spans 2 columns) */}
        <div className="col-span-2 border border-green-500 p-2">
          <div className="text-sm mb-2">Stack</div>

          {/* Solution Display */}
          {currentSnapshot.solution && (
            <div
              className={`mb-2 p-2 border ${
                currentSnapshot.solution.repeated
                  ? "border-red-300 bg-red-900/20"
                  : "border-green-300 bg-green-900/20"
              } text-sm`}
            >
              <div className="font-bold mb-1">
                {currentSnapshot.solution.repeated
                  ? "Repeated Solution (Backing Out)"
                  : "Solution Found"}
              </div>
              {Object.entries(currentSnapshot.solution.bindings).map(
                ([key, value]) => (
                  <div key={key}>
                    {key} = {formatClause(value)}
                  </div>
                )
              )}
            </div>
          )}

          <div className="space-y-1">
            {[...currentSnapshot.stack].reverse().map((frame, idx) => {
              const isLastFrame = idx === 0;
              const isSolutionFrame = isLastFrame && currentSnapshot.solution;
              return (
                <div key={idx} className="flex items-start gap-2">
                  {isLastFrame && (
                    <div className="text-green-500 animate-pulse mt-2">
                      <ArrowRight size={16} />
                    </div>
                  )}
                  <div
                    className={`flex-1 border px-2 py-1 text-sm ${
                      isLastFrame
                        ? "border-green-400 bg-green-900/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                        : "border-green-500"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="hover:text-green-300 cursor-help whitespace-nowrap"
                          onMouseEnter={() => setHoveredRule(frame.ruleIndex)}
                          onMouseLeave={() => setHoveredRule(null)}
                        >
                          R{frame.ruleIndex}
                        </div>
                        <div className="break-all">
                          Goals: {frame.goals.map(formatClause).join(", ")}
                        </div>
                      </div>
                      <div className="break-all pl-6">
                        θ:{" "}
                        {Object.keys(frame.subst.bindings).length === 0
                          ? "∅"
                          : Object.entries(frame.subst.bindings)
                              .map(
                                ([key, value]) =>
                                  `${key}=${formatClause(value)}`
                              )
                              .join(", ")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls and Timeline */}
        <div className="col-span-3 border border-green-500 p-2 space-y-2">
          <Timeline
            data={doc.trace}
            currentStep={currentStep}
            onStepSelect={setCurrentStep}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-2 py-1 border border-green-500 disabled:opacity-50 hover:bg-green-500 hover:text-black transition-colors flex items-center gap-1 text-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() =>
                  setCurrentStep(
                    Math.min(doc.trace!.stack.length - 1, currentStep + 1)
                  )
                }
                disabled={currentStep === doc.trace!.stack.length - 1}
                className="px-2 py-1 border border-green-500 disabled:opacity-50 hover:bg-green-500 hover:text-black transition-colors flex items-center gap-1 text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  changeDoc((d) => {
                    delete d.trace;
                  });
                  setJsonInput("");
                  setCurrentStep(0);
                }}
                className="px-2 py-1 border border-green-500 hover:bg-green-500 hover:text-black transition-colors text-sm"
              >
                Reset
              </button>
            </div>
            <div className="text-sm">
              Step {currentStep + 1} of {doc.trace!.stack.length}
              {currentSnapshot.solution &&
                (currentSnapshot.solution.repeated
                  ? " (Repeated solution!)"
                  : " (Solution found!)")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: PrologDebugger,
});
