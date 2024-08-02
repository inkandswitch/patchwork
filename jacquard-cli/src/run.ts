import { Repo } from "@automerge/automerge-repo";
import { spawn } from "child_process";
import path from "path";
import { CommandLineArgs } from "./index.js";
import { latex } from "./latex.js";
import { push } from "./push.js";
import { addPrefix, interceptOutput } from "./util.js";

/**
 * RunResult bundles information about how running a process went. It's how
 * `run` communicates with `push`. As `push` uploads files to Automerge, this
 * will be transformed into a BuildRun.
 */
export type RunResult = {
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
  args: CommandLineArgs & { onLogOutput?: (output: string) => void },
  wait = true
) {
  const {
    dir,
    inputs = [],
    outputs = [],
    command,
    runPrefix,
    onLogOutput,
  } = args;

  if (!command) {
    console.error("No command provided");
    process.exit(1);
  }

  // hack to make latex subset of run
  const commandSplit = command.split(" ");
  if (commandSplit.length === 2 && commandSplit[0] === "latex") {
    return await latex(repo, commandSplit[1], args);
  }

  await interceptOutput(
    {
      onStdout: (data) => {
        onLogOutput?.(data.toString());
      },
      onStderr: (data) => {
        onLogOutput?.(data.toString());
      },
    },
    async () => {
      const timestampStart = Date.now();

      await new Promise((resolve, reject) => {
        const child = spawn(addPrefix(runPrefix, command), { shell: true });

        child.stdout.on("data", (data) => {
          process.stdout.write(data.toString());
          data
            .toString()
            .split("\n")
            .forEach((line: string) => {
              const match = line.match(JACQUARD_DECLARE_REGEX);

              if (match) {
                const { type, filePath } = match.groups!;
                const relativePath = `./${path.relative(dir, filePath)}`;

                if (type === "input") {
                  inputs.push(relativePath);
                } else {
                  outputs.push(relativePath);
                }
              }
            });
        });

        child.stderr.on("data", (data) => {
          process.stderr.write(data.toString());
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
      const buildMetadata: RunResult = {
        outputs,
        command,
        inputs,
        timestamp: timestampEnd,
        duration: timestampEnd - timestampStart,
      };

      await push(repo, args, buildMetadata, wait);
    }
  );
}
