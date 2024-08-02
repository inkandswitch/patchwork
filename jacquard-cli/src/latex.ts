import { Repo } from "@automerge/automerge-repo";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from "./index";
import { push } from "./push";
import { RunResult } from "./run";
import { addPrefix, interceptOutput } from "./util";

const FILE_REFRENCE_REGEX = /^<use (?<filePath>.*)\>$/;

export async function latex(
  repo: Repo,
  filePath: string,
  args: CommandLineArgs & { onLogOutput?: (output: string) => void }
) {
  const { dir, runPrefix, onLogOutput } = args;

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
      const inputs: string[] = [`./${filePath}`];
      const outputs: string[] = [`./${replaceExtension(filePath, "pdf")}`];

      // run tectonic

      const timestampStart = Date.now();

      await new Promise((resolve, reject) => {
        const child = spawn(
          addPrefix(runPrefix, "tectonic"),
          [filePath, "--keep-logs"],
          { shell: true }
        );

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

      const runResult: RunResult = {
        inputs,
        outputs,
        command: `latex ${filePath}`,
        timestamp: timestampEnd,
        duration: timestampEnd - timestampStart,
      };

      await push(repo, args, runResult);
    }
  );
}

const replaceExtension = (filePath: string, newExtension: string) => {
  const extension = path.extname(filePath);
  return `${filePath.slice(0, -extension.length)}.${newExtension}`;
};
