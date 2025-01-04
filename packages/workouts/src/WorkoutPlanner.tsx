import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Icon } from "@patchwork/sdk/ui";
import { useCallback } from "react";
import CircuitForm from "./CircuitForm";
import ExerciseForm from "./ExerciseForm";
import {
  WorkoutDoc,
  CircuitBlock,
  ExerciseBlock,
  CircuitExercise,
  Block,
} from "./types";
import { createExercise } from "./utils";

export const WorkoutPlanner = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [doc, changeDoc] = useDocument<WorkoutDoc>(docUrl);

  const addWorkout = useCallback(() => {
    changeDoc((doc) => {
      doc.workouts.push({
        id: crypto.randomUUID(),
        name: `Day ${doc.workouts.length + 1}`,
        blocks: [],
      });
    });
  }, [changeDoc]);

  const updateWorkoutName = useCallback(
    (workoutId: string, name: string) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          workout.name = name;
        }
      });
    },
    [changeDoc]
  );

  const addExercise = useCallback(
    (workoutId: string) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          workout.blocks.push(createExercise("regular"));
        }
      });
    },
    [changeDoc]
  );

  const deleteBlock = useCallback(
    (workoutId: string, blockId: string) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          const index = workout.blocks.findIndex((b) => b.id === blockId);
          if (index !== -1) {
            workout.blocks.splice(index, 1);
          }
        }
      });
    },
    [changeDoc]
  );

  const createCircuit = useCallback(
    (workoutId: string, blockIndex: number) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          const existingBlock = workout.blocks[blockIndex] as ExerciseBlock;
          if (existingBlock && existingBlock.type === "exercise") {
            const circuitBlock: CircuitBlock = {
              id: crypto.randomUUID(),
              type: "circuit",
              rounds: 3,
              restBetweenRounds: 60,
              exercises: [
                {
                  ...existingBlock,
                  restAfter: 30,
                } as CircuitExercise,
              ],
            };
            workout.blocks[blockIndex] = circuitBlock;
          }
        }
      });
    },
    [changeDoc]
  );

  const updateExercise = useCallback(
    (workoutId: string, blockId: string, updates: Partial<ExerciseBlock>) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          const block = workout.blocks.find(
            (b) => b.id === blockId
          ) as ExerciseBlock;
          if (block && block.type === "exercise") {
            Object.entries(updates).forEach(([key, value]) => {
              (block as any)[key] = value;
            });
          }
        }
      });
    },
    [changeDoc]
  );

  const updateCircuit = useCallback(
    (workoutId: string, blockId: string, field: string, value: any) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          const block = workout.blocks.find(
            (b) => b.id === blockId
          ) as CircuitBlock;
          if (block && block.type === "circuit") {
            if (field === "exercises") {
              block.exercises = value;
            } else {
              (block as any)[field] = value;
            }
          }
        }
      });
    },
    [changeDoc]
  );

  const updateCircuitExercise = useCallback(
    (
      workoutId: string,
      circuitId: string,
      exerciseId: string,
      updates: Partial<CircuitExercise>
    ) => {
      changeDoc((doc) => {
        const workout = doc.workouts.find((w) => w.id === workoutId);
        if (workout) {
          const circuit = workout.blocks.find(
            (b) => b.id === circuitId && b.type === "circuit"
          ) as CircuitBlock | undefined;

          if (circuit) {
            const exercise = circuit.exercises.find((e) => e.id === exerciseId);
            if (exercise) {
              Object.entries(updates).forEach(([key, value]) => {
                (exercise as any)[key] = value;
              });
            }
          }
        }
      });
    },
    [changeDoc]
  );

  const updateOneRM = useCallback(
    (lift: string, value: number) => {
      changeDoc((doc) => {
        doc.oneRMs[lift] = value;
      });
    },
    [changeDoc]
  );

  if (!doc) return null;

  return (
    <div className="max-w-4xl mx-auto p-4" role="main">
      <section className="mb-8" aria-labelledby="one-rm-title">
        <h2 id="one-rm-title" className="text-xl font-bold mb-4">
          1 Rep Maxes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(doc.oneRMs).map(([lift, weight]) => (
            <div key={lift} className="p-4 bg-gray-100 rounded">
              <label htmlFor={`oneRM-${lift}`} className="font-medium block">
                {lift}
              </label>
              <input
                id={`oneRM-${lift}`}
                type="number"
                min="0"
                max="2000"
                value={weight}
                onChange={(e) =>
                  updateOneRM(lift, Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-24 p-1 border rounded mt-1"
                aria-label={`${lift} one rep max`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6" aria-label="Workout days">
        {doc.workouts.map((workout) => (
          <div key={workout.id} className="border rounded p-4">
            <input
              type="text"
              value={workout.name}
              onChange={(e) => updateWorkoutName(workout.id, e.target.value)}
              className="text-lg font-bold mb-4 p-1 border rounded"
              aria-label="Workout day name"
            />

            <div className="space-y-4">
              {workout.blocks.map((block, blockIndex) =>
                block.type === "circuit" ? (
                  <CircuitForm
                    key={block.id}
                    circuit={block}
                    oneRMs={doc.oneRMs}
                    onUpdate={(field, value) =>
                      updateCircuit(workout.id, block.id, field, value)
                    }
                    onDelete={() => deleteBlock(workout.id, block.id)}
                  />
                ) : (
                  <ExerciseForm
                    key={block.id}
                    exercise={block}
                    oneRMs={doc.oneRMs}
                    onUpdate={(field, value) =>
                      updateExercise(workout.id, block.id, { [field]: value })
                    }
                    onDelete={() => deleteBlock(workout.id, block.id)}
                    showMakeCircuit={true}
                    onMakeCircuit={() => createCircuit(workout.id, blockIndex)}
                  />
                )
              )}

              <button
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                onClick={() => addExercise(workout.id)}
                aria-label="Add exercise"
              >
                <Icon type="Plus" size={20} /> Add Exercise
              </button>
            </div>
          </div>
        ))}

        <button
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
          onClick={addWorkout}
          aria-label="Add workout day"
        >
          <Icon type="Plus" size={20} /> Add Workout Day
        </button>
      </section>
    </div>
  );
};

export default WorkoutPlanner;
