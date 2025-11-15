import React from "react";
import { StopCircle } from "lucide-react";

interface ExecutionStatusProps {
  executionState: "idle" | "planning" | "executing";
  currentStepIndex: number;
  executionPlan: string[];
  loading: boolean;
  onStop: () => void;
}

export const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  executionState,
  currentStepIndex,
  executionPlan,
  loading,
  onStop,
}) => {
  if (!loading) return null;

  if (executionState === "idle") {
    return <div className="mt-2 text-sm opacity-70">Loading...</div>;
  }

  return (
    <div className="alert alert-info mt-2">
      <div>
        <div className="text-sm font-medium mb-1">
          {executionState === "planning" && "Planning steps..."}
          {executionState === "executing" &&
            `Executing step ${currentStepIndex + 1} of ${executionPlan.length}`}
        </div>
        {executionPlan.length > 0 && (
          <div className="text-xs mb-2">
            {executionPlan.map((step, i) => (
              <div
                key={i}
                className={
                  i === currentStepIndex ? "font-medium" : "opacity-70"
                }
              >
                {i + 1}. {step} {i < currentStepIndex && "✓"}
              </div>
            ))}
          </div>
        )}
        <button onClick={onStop} className="btn btn-error btn-sm mt-2">
          <StopCircle size={14} className="mr-1" />
          Stop
        </button>
      </div>
    </div>
  );
};

