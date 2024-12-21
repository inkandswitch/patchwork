import React from "react";
import { CircuitBlock, OneRMs } from "./types";
import { formatRestPeriod } from "./utils";
import ExerciseForm from "./ExerciseForm";
import { Icon } from "@patchwork/sdk/ui";

interface CircuitFormProps {
  circuit: CircuitBlock;
  oneRMs: OneRMs;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
}

export const CircuitForm: React.FC<CircuitFormProps> = ({
  circuit,
  oneRMs,
  onUpdate,
  onDelete,
}) => {
  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...circuit.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    onUpdate("exercises", newExercises);
  };

  return (
    <div
      className="bg-gray-100 p-4 rounded border"
      role="region"
      aria-label="Circuit block"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="font-medium">Circuit</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="rounds" className="text-sm text-gray-500">
              Rounds:
            </label>
            <input
              id="rounds"
              type="number"
              min="1"
              max="20"
              value={circuit.rounds}
              onChange={(e) =>
                onUpdate("rounds", Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-16 p-1 border rounded text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rest between rounds:</span>
            <span className="text-sm font-medium">
              {formatRestPeriod(circuit.restBetweenRounds)}
            </span>
            <div className="flex flex-col">
              <button
                className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                onClick={() =>
                  onUpdate("restBetweenRounds", circuit.restBetweenRounds + 30)
                }
                aria-label="Increase rest time"
              >
                <Icon type="ChevronUp" size={12} />
              </button>
              <button
                className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                onClick={() =>
                  onUpdate(
                    "restBetweenRounds",
                    Math.max(0, circuit.restBetweenRounds - 30)
                  )
                }
                aria-label="Decrease rest time"
              >
                <Icon type="ChevronDown" size={12} />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
          aria-label="Delete circuit"
        >
          <Icon type="Trash" size={20} />
        </button>
      </div>

      <div className="space-y-2 pl-4 border-l-2 border-gray-300">
        {circuit.exercises.map((exercise, index) => (
          <div key={exercise.id} className="bg-white p-4 rounded border">
            <div className="flex gap-4 items-center mb-2">
              <span
                className="text-sm font-medium text-blue-600"
                aria-label={`Exercise ${index + 1}`}
              >
                {index + 1}
              </span>
              <ExerciseForm
                exercise={exercise}
                oneRMs={oneRMs}
                onUpdate={(field, value) => updateExercise(index, field, value)}
              />
              {index < circuit.exercises.length - 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rest:</span>
                  <span className="text-sm font-medium">
                    {formatRestPeriod(exercise.restAfter)}
                  </span>
                  <div className="flex flex-col">
                    <button
                      className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                      onClick={() =>
                        updateExercise(
                          index,
                          "restAfter",
                          exercise.restAfter + 30
                        )
                      }
                      aria-label="Increase rest after exercise"
                    >
                      <Icon type="ChevronUp" size={12} />
                    </button>
                    <button
                      className="h-4 px-1 bg-gray-200 hover:bg-gray-300 rounded-sm"
                      onClick={() =>
                        updateExercise(
                          index,
                          "restAfter",
                          Math.max(0, exercise.restAfter - 30)
                        )
                      }
                      aria-label="Decrease rest after exercise"
                    >
                      <Icon type="ChevronDown" size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CircuitForm;
