import { CircuitBlock, ExerciseBlock } from "./types";

export const formatRestPeriod = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const parseRestPeriod = (timeStr: string): number => {
  const [minutes, seconds] = timeStr
    .split(":")
    .map((num) => parseInt(num) || 0);
  return Math.max(0, minutes * 60 + seconds);
};

export const calculateWeight = (percentage: number, oneRM: number): number => {
  if (percentage < 0 || percentage > 100 || oneRM < 0) return 0;
  return Math.round((percentage / 100) * oneRM);
};

export const calculatePercentage = (weight: number, oneRM: number): number => {
  if (weight < 0 || oneRM <= 0) return 0;
  return Math.min(100, Math.round((weight / oneRM) * 100));
};

export const createExercise = (
  blockType: "regular" | "circuit"
): ExerciseBlock | CircuitBlock => {
  const base = {
    id: crypto.randomUUID(),
    name: "",
    notes: "",
    restPeriod: 180,
    sets: [{ reps: 5, weight: 135, percentage: 0, targetRPE: 7 }],
    type: "exercise" as const,
  };

  if (blockType === "circuit") {
    return {
      ...base,
      type: "circuit",
      rounds: 3,
      exercises: [],
      restBetweenRounds: 120,
    };
  }

  return base;
};
