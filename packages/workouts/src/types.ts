// Basic building blocks
export interface WorkoutDoc {
  title: string;
  workouts: Workout[];
  oneRMs: OneRMs;
}

export interface Set {
  reps: number;
  weight: number;
  percentage: number;
  targetRPE: number;
}

export interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: Set[];
  restPeriod: number; // in seconds
}

export interface CircuitExercise extends Exercise {
  restAfter: number; // rest after this exercise in circuit (except last)
}

// Blocks represent either single exercises or circuits
export interface ExerciseBlock extends Exercise {
  type: "exercise";
}

export interface CircuitBlock {
  id: string;
  type: "circuit";
  rounds: number;
  restBetweenRounds: number;
  exercises: CircuitExercise[];
}

export type Block = ExerciseBlock | CircuitBlock;

// Top level structures
export interface Workout {
  id: string;
  name: string;
  blocks: Block[];
}

export interface OneRMs {
  [key: string]: number; // exercise name -> weight
}
