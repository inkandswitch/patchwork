import * as Automerge from "@automerge/automerge";

export const lookup = <T = any>(
  doc: any,
  path: Automerge.Prop[]
): T | undefined => {
  let current = doc;
  for (const key of path) {
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
};
