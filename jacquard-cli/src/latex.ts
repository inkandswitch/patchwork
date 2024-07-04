import { Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from "./index.js";
import { spawn } from "child_process";

const FILE_REFRENCE_REGEX = /^<use (?<filePath>.*)\>$/;

export async function latex(
  repo: Repo,
  filePath: string,
  { dir, automergeDocUrl }: CommandLineArgs
) {
  // pull before to ensure we run on latest files
  // todo: find better approach
  // await pull(repo, { dir, automergeDocUrl });

  // run tectonic

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

  const extension = path.extname(filePath);
  const logPath = `${filePath.slice(0, -extension.length)}.log`;

  const logContent = fs.readFileSync(logPath, "utf8");

  logContent.split("\n").map((line) => {
    const match = line.match(FILE_REFRENCE_REGEX);

    if (match) {
      console.log("use", match.groups.filePath);
    }
  });

  // delete build log

  fs.unlinkSync(logPath);

  /* await push(
    repo,
    {
      dir,
      automergeDocUrl,
      syncServerStorageId,
      patchworkUrl,
    },
    buildMetadata
  ); */
}
