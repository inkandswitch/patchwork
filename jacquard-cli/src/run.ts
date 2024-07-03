import { getHeads, uuid } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { exec } from "child_process";
import { push } from "./push.js";
import { CommandLineArgs } from "./index.js";

export type BuildMetadata = {
  id: string;
  outputs: string[];
  inputs: string[];
  command: string;
  timestamp: number;
};

export async function run(
  repo: Repo,
  {
    dir,
    automergeDocUrl,
    syncServerStorageId,
    patchworkUrl,
    inputs,
    outputs,
    command,
  }: CommandLineArgs
) {
  let currentHeads;
  if (automergeDocUrl != null) {
    const currentDoc = await repo.find(automergeDocUrl).doc();
    currentHeads = getHeads(currentDoc);
  } else {
    currentHeads = null;
  }

  await new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      resolve(true);
    });
  });

  // todo: rethink how this works with multiple build rules
  const buildMetadata: BuildMetadata = {
    id: uuid(),
    outputs,
    command,
    inputs,
    timestamp: Date.now(),
  };

  await push(
    repo,
    {
      dir,
      automergeDocUrl,
      syncServerStorageId,
      patchworkUrl,
    },
    buildMetadata
  );
}
