import React, { memo } from "react";
import { Exercise, Set } from "./types";
import {
  formatRestPeriod,
  calculateWeight,
  calculatePercentage,
} from "./utils";
import { Icon } from "@patchwork/sdk/ui";

interface ExerciseFormProps {
  exercise: Exercise;
  oneRMs: Record<string, number>;
  onUpdate: (field: string, value: any) => void;
  onDelete?: () => void;
  showMakeCircuit?: boolean;
  onMakeCircuit?: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = memo(
  ({
    exercise,
    oneRMs,
    onUpdate,
    onDelete,
    showMakeCircuit,
    onMakeCircuit,
  }) => {
    const updateSet = (index: number, field: keyof Set, value: number) => {
      const newSets = [...exercise.sets];
      const oneRM = oneRMs[exercise.name] || 0;

      if (field === "weight") {
        newSets[index] = {
          ...newSets[index],
          weight: Math.max(0, value),
          percentage: calculatePercentage(Math.max(0, value), oneRM),
        };
      } else if (field === "percentage") {
        newSets[index] = {
          ...newSets[index],
          percentage: Math.min(100, Math.max(0, value)),
          weight: calculateWeight(Math.min(100, Math.max(0, value)), oneRM),
        };
      } else if (field === "targetRPE") {
        newSets[index] = {
          ...newSets[index],
          targetRPE: Math.min(10, Math.max(1, value)),
        };
      } else {
        newSets[index] = {
          ...newSets[index],
          [field]: Math.max(0, value),
        };
      }

      onUpdate("sets", newSets);
    };

    return (
      <div
        className="bg-gray-50 p-4 rounded"
        role="region"
        aria-label="Exercise block"
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Exercise name"
              value={exercise.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              className="w-full p-1 border rounded"
              aria-label="Exercise name"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rest:</span>
            <span className="text-sm font-medium">
              {formatRestPeriod(exercise.restPeriod)}
            </span>
            <div className="flex flex-col">
              <button
                className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                onClick={() => onUpdate("restPeriod", exercise.restPeriod + 30)}
                aria-label="Increase rest period"
              >
                <Icon type="ChevronUp" size={12} />
              </button>
              <button
                className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                onClick={() =>
                  onUpdate("restPeriod", Math.max(0, exercise.restPeriod - 30))
                }
                aria-label="Decrease rest period"
              >
                <Icon type="ChevronDown" size={12} />
              </button>
            </div>
          </div>
          {onDelete && (
            <button
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
              aria-label="Delete exercise"
            >
              <Icon type="Trash2" size={20} />
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Notes/cues..."
          value={exercise.notes}
          onChange={(e) => onUpdate("notes", e.target.value)}
          className="w-full p-2 border rounded text-sm mb-4"
          aria-label="Exercise notes"
        />

        <div className="space-y-2">
          {exercise.sets.map((set, idx) => (
            <div
              key={idx}
              className="flex flex-wrap gap-4 items-center bg-white p-2 rounded border"
              role="group"
              aria-label={`Set ${idx + 1}`}
            >
              <span className="text-sm text-gray-500 w-6">{idx + 1}.</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(idx, "reps", parseInt(e.target.value) || 0)
                  }
                  className="w-12 p-1 border rounded text-center"
                  min="0"
                  aria-label="Repetitions"
                />
                <span aria-hidden="true">×</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(idx, "weight", parseInt(e.target.value) || 0)
                  }
                  className="w-20 p-1 border rounded text-center"
                  min="0"
                  aria-label="Weight in pounds"
                />
                <span className="text-gray-500">lbs</span>
                <span className="text-gray-400" aria-hidden="true">
                  /
                </span>
                <input
                  type="number"
                  value={set.percentage}
                  onChange={(e) =>
                    updateSet(idx, "percentage", parseInt(e.target.value) || 0)
                  }
                  className="w-16 p-1 border rounded text-center"
                  min="0"
                  max="100"
                  aria-label="Percentage of one rep max"
                />
                <span className="text-gray-500">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500" aria-hidden="true">
                  @
                </span>
                <input
                  type="number"
                  value={set.targetRPE}
                  onChange={(e) =>
                    updateSet(idx, "targetRPE", parseFloat(e.target.value) || 1)
                  }
                  className="w-16 p-1 border rounded text-center"
                  step="0.5"
                  min="1"
                  max="10"
                  aria-label="Target RPE"
                />
                <span className="text-sm text-gray-500">RPE</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            onClick={() => {
              const lastSet = exercise.sets[exercise.sets.length - 1];
              onUpdate("sets", [...exercise.sets, { ...lastSet }]);
            }}
            aria-label="Add set"
          >
            <Icon type="Plus" size={16} /> Add Set
          </button>

          {showMakeCircuit && onMakeCircuit && (
            <button
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              onClick={onMakeCircuit}
              aria-label="Convert to circuit"
            >
              <Icon type="Plus" size={16} /> Make Circuit
            </button>
          )}
        </div>
      </div>
    );
  }
);

export default ExerciseForm;
