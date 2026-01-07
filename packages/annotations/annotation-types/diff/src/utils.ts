import { Automerge } from "@automerge/automerge-repo/slim";

export const last = <T>(array: T[]): T | undefined => {
  return array.length > 0 ? array[array.length - 1] : undefined;
};

export const lookup = <T = unknown>(
  doc: unknown,
  path: Automerge.Prop[]
): T | undefined => {
  let current = doc as Record<string | number, unknown>;
  for (const key of path) {
    current = current[key] as Record<string | number, unknown>;
    if (current === undefined) {
      return undefined;
    }
  }
  return current as T;
};
