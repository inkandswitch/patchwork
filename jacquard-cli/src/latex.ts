import { Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from "./index";
import { spawn } from "child_process";
import { pull } from "./pull";
import { push } from "./push";
import { BuildMetadata } from "./run";
import { uuid } from "@automerge/automerge";

const FILE_REFRENCE_REGEX = /^<use (?<filePath>.*)\>$/;

export async function latex(
  repo: Repo,
  filePath: string,
  { dir, projectFolderUrl }: CommandLineArgs
) {
  const inputs: string[] = [`./${filePath}`];
  const outputs: string[] = [`./${replaceExtension(filePath, "pdf")}`];

  // pull before to ensure we run on latest files
  // todo: find better approach
  await pull(repo, { dir, projectFolderUrl });

  // run tectonic

  const timestampStart = Date.now();

  await new Promise((resolve, reject) => {
    const child = spawn("tectonic", [filePath, "--keep-logs"]);

    child.stdout.on("data", (data) => {
      console.log(data.toString());
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

  // parse dependencies from build log

  const logPath = replaceExtension(filePath, "log");
  const logContent = fs.readFileSync(logPath, "utf8");

  logContent.split("\n").map((line) => {
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
    inputs.push(`./${path.relative(dir, path.join(texFileDir, bibFilePath))}`);
  }

  // delete build log

  fs.unlinkSync(logPath);

  const timestampEnd = Date.now();

  const buildMetadata: BuildMetadata = {
    id: uuid(),
    inputs,
    outputs,
    command: `latex ${filePath}`,
    timestamp: timestampEnd,
    duration: timestampEnd - timestampStart,
  };

  await push(
    repo,
    {
      dir,
      projectFolderUrl,
    },
    buildMetadata
  );
}

const replaceExtension = (filePath: string, newExtension: string) => {
  const extension = path.extname(filePath);
  return `${filePath.slice(0, -extension.length)}.${newExtension}`;
};
