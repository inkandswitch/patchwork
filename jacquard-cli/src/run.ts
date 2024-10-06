import { Repo } from "@automerge/automerge-repo";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { BuildRunSpec } from "../../packages/jacquard/src/datatype.js";
import { CommandLineArgs } from "./index.js";
import { push } from "./push.js";
import { addPrefix, interceptOutput, replaceExtension } from "./util.js";

/**
 * RunResult bundles information about how running a process went. It's how
 * `run` communicates with `push`. As `push` uploads files to Automerge, this
 * will be transformed into a BuildRun.
 */
export type RunResult = {
  spec: BuildRunSpec;
  outputs: string[];
  inputs: string[];
  timestamp: number;
  duration: number;
};

// TODO: maybe we set a JACQUARD_OUTPUTS_FILE env var, then the process writes
// output declarations to that file rather than stdout?

const JACQUARD_DECLARE_REGEX =
  /jacquard: declare (?<type>(input|output)) (?<filePath>.*)/;

export async function run(
  repo: Repo,
  spec: BuildRunSpec,
  // TODO: "onLogOutput" is not being used right now, cuz 1. perf
  // problems, 2. intercepting output with interceptOutput causes
  // problems in Node tests.
  args: CommandLineArgs & { onLogOutput?: (output: string) => void },
  wait = true
) {
  const { dir, runPrefix } = args;

  const inputs: string[] = [...spec.explicitInputs];
  const outputs: string[] = [...spec.explicitOutputs];

  const timestampStart = Date.now();

  await new Promise((resolve, reject) => {
    const child = spawn(addPrefix(runPrefix, spec.command), {
      shell: true,
    });

    child.stdout.on("data", (data) => {
      process.stdout.write(data.toString());
      if (spec.autoDeps.stdoutDeclared) {
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
      }
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

  if (spec.autoDeps.latex) {
    // TODO: very fragile (tho it's always been)
    const filePath = spec.command.split(" ")[1];
    inputs.push(`./${filePath}`);
    outputs.push(`./${replaceExtension(filePath, "pdf")}`);

    // parse dependencies from build log

    const logPath = replaceExtension(filePath, "log");
    const logContent = fs.readFileSync(logPath, "utf8");

    logContent.split("\n").map((line) => {
      const FILE_REFRENCE_REGEX = /^<use (?<filePath>.*)\>$/;
      const match = line.match(FILE_REFRENCE_REGEX);

      if (match) {
        inputs.push(`./${match.groups!.filePath}`);
      }
    });

    // hack: parse bib file references
    // todo: find a more principled solution

    const sourceContent = fs.readFileSync(filePath, "utf8");
    const BIB_REF_REGEX = /\\bibliography\{(?<filePath>[^}]*)\}/g;
    for (const match of sourceContent.matchAll(BIB_REF_REGEX)) {
      const texFileDir = path.dirname(filePath);
      const bibFilePath = match.groups!.filePath;
      const bibFilePathWithExt = path.extname(bibFilePath)
        ? bibFilePath
        : `${bibFilePath}.bib`;
      inputs.push(
        `./${path.relative(dir, path.join(texFileDir, bibFilePathWithExt))}`
      );
    }

    // delete build log
    fs.unlinkSync(logPath);
  }

  // todo: rethink how this works with multiple build rules
  const buildMetadata: RunResult = {
    spec,
    inputs,
    outputs,
    timestamp: timestampEnd,
    duration: timestampEnd - timestampStart,
  };

  await push(repo, args, buildMetadata, wait);
}

export function buildRunSpecFromArgs(args: CommandLineArgs): BuildRunSpec {
  if (!args.command) {
    console.error("No command provided");
    process.exit(1);
  }

  return {
    command: args.command,
    autoDeps: {
      stdoutDeclared: args.stdoutDeclaredDeps,
      latex: args.latexDeps,
    },
    explicitInputs: args.inputs ?? [],
    explicitOutputs: args.outputs ?? [],
    // TODO: this silly dance is because we can't put undefined values into
    // Automerge; is there a better way?
    ...(args.name && {
      name: args.name,
    }),
  };
}
