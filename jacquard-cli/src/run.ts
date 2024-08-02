import fs from "fs";
import { Repo } from "@automerge/automerge-repo";
import { spawn } from "child_process";
import path from "path";
import { CommandLineArgs } from "./index.js";
import { push } from "./push.js";
import { addPrefix, interceptOutput } from "./util.js";

/**
 * RunResult bundles information about how running a process went. It's how
 * `run` communicates with `push`. As `push` uploads files to Automerge, this
 * will be transformed into a BuildRun.
 */

export type RunDependencies = {
  outputs: string[];
  inputs: string[];
};

export type RunResult = {
  command: string;
  timestamp: number;
  duration: number;
  dependencies: RunDependencies;
};

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

  const jacquardDir = path.join(dir, ".jacquard");
  if (!fs.existsSync(jacquardDir)) {
    fs.mkdirSync(jacquardDir, { recursive: true });
  }

  const runDependenciesFilePath = path.join(
    jacquardDir,
    "runDependencies.json"
  );
  if (fs.existsSync(runDependenciesFilePath)) {
    fs.unlinkSync(runDependenciesFilePath);
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
      let dependencies: RunDependencies;
      if (fs.existsSync(runDependenciesFilePath)) {
        dependencies = JSON.parse(
          fs.readFileSync(runDependenciesFilePath, "utf8")
        ) as RunDependencies;
      } else {
        dependencies = { inputs: [], outputs: [] };
      }

      // todo: rethink how this works with multiple build rules
      const buildMetadata: RunResult = {
        command,
        timestamp: timestampEnd,
        duration: timestampEnd - timestampStart,
        dependencies: {
          inputs: [...inputs, ...dependencies.inputs],
          outputs: [...outputs, ...dependencies.outputs],
        },
      };

      await push(repo, args, buildMetadata, wait);
    }
  );
}
