import path from "path";
import { uuid } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { spawn } from "child_process";
import { push } from "./push.js";
import { CommandLineArgs } from "./index.js";
import { pull } from "./pull.js";
import { latex } from "./latex.js";

// TODO: this is an awful lot like BuildRun, but not; at the very least a naming
// issue
export type BuildMetadata = {
  id: string;
  outputs: string[];
  inputs: string[];
  command: string;
  timestamp: number;
  duration: number;
};

// TODO: maybe we set a JACQUARD_OUTPUTS_FILE env var, then the process writes
// output declarations to that file rather than stdout?

const JACQUARD_DECLARE_REGEX =
  /jacquard: declare (?<type>(input|output)) (?<filePath>.*)/;

export async function run(
  repo: Repo,
  {
    dir,
    projectFolderUrl,
    syncServerStorageId,
    patchworkUrl,
    inputs = [],
    outputs = [],
    command,
  }: CommandLineArgs,
  wait = true,
) {
  // hack to make latex subset of run
  const commandSplit = command.split(" ");
  if (commandSplit.length === 2 && commandSplit[0] === 'latex') {
    return await latex(repo, commandSplit[1], { dir, projectFolderUrl });
  }

  // pull before to ensure we run on latest files
  // todo: find better approach
  console.log("pull changes");
  await pull(repo, { dir, projectFolderUrl });

  const timestampStart = Date.now();

  await new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, { shell: true });

    child.stdout.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .forEach((line: string) => {
          const match = line.match(JACQUARD_DECLARE_REGEX);

          if (match) {
            const { type, filePath } = match.groups;
            const relativePath = `./${path.relative(dir, filePath)}`;

            if (type === "input") {
              inputs.push(relativePath);
            } else {
              outputs.push(relativePath);
            }
          } else {
            console.log(line);
          }
        });
    });

    child.stderr.on("data", (data) => {
      console.error(data.toString());
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve(true);
      }
    });

    child.on("error", (error) => {
      console.error(`Error executing command: ${error.message}`);
      reject(error);
    });
  });

  const timestampEnd = Date.now();

  // todo: rethink how this works with multiple build rules
  const buildMetadata: BuildMetadata = {
    id: uuid(),
    outputs,
    command,
    inputs,
    timestamp: timestampEnd,
    duration: timestampEnd - timestampStart,
  };

  await push(
    repo,
    {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
    },
    buildMetadata,
    wait
  );
}
