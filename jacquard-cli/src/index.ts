#!/usr/bin/env bun
/*
  use this line to inspect the CLI with a debugger
  #!/usr/bin/env bun --inspect-wait
*/

import commandLineArgs from "command-line-args";
import fs from "fs";

import { AutomergeUrl, Repo, StorageId } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

import { activateBranch } from "./activate";
import { listBranches } from "./branch";
import { pull } from "./pull";
import { push } from "./push";
import { refresh } from "./refresh";
import { run } from "./run";
import { getJacquardConfig } from "./util";
import { watch } from "./watch";
import { watchRefreshRequests } from "./watchRefreshRequests";

// those marked non-optional here are those with defaults provided in allFlags below
export type CommandLineArgs = {
  dir: string;
  projectFolderUrl?: AutomergeUrl;
  test: boolean;
  syncServerUrl: string;
  syncServerStorageId: StorageId;
  patchworkUrl: string;
  inputs?: string[];
  outputs?: string[];
  command?: string;
  branchUrl?: string;
  runPrefix?: string;
};

const main = async () => {
  const mainDefinitions = [{ name: "action", defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });

  const argv = mainOptions._unknown || [];

  const jacquardConfig = getJacquardConfig();

  const allFlags = [
    { name: "dir", type: String, defaultValue: "." },
    {
      name: "projectFolderUrl",
      type: String,
      defaultValue: jacquardConfig?.projectFolderUrl,
    },
    { name: "branchUrl", type: String },
    { name: "test", type: Boolean, defaultValue: false },
    {
      name: "syncServerUrl",
      type: String,
      defaultValue:
        jacquardConfig?.syncServer?.url ?? "wss://sync.automerge.org",
    },
    {
      name: "syncServerStorageId",
      type: String,
      defaultValue:
        jacquardConfig?.syncServer?.storageId ??
        ("3760df37-a4c6-4f66-9ecd-732039a9385d" as StorageId),
    },
    {
      name: "patchworkUrl",
      type: String,
      defaultValue: "http://localhost:5173",
    },
    {
      name: "inputs",
      type: String,
      multiple: true,
    },
    {
      name: "outputs",
      type: String,
      multiple: true,
    },
    {
      name: "command",
      type: String,
    },
    {
      name: "runPrefix",
      type: String,
      default: jacquardConfig?.runPrefix,
    },
  ];

  const args = commandLineArgs(allFlags, {
    argv,
    stopAtFirstUnknown:
      mainOptions.action === "run" || mainOptions.action === "latex", // allow run and latex to have rest arguments
  }) as CommandLineArgs;

  const {
    dir,
    test,
    projectFolderUrl,
    syncServerUrl,
    syncServerStorageId,
    command,
    branchUrl,
    runPrefix,
  } = args;

  if (!projectFolderUrl && mainOptions.command == "pull") {
    console.error("No URL specified: use --projectFolderUrl <url>");
    process.exit(1);
  }

  if (!dir) {
    console.error("No directory specified: use --dir <path>");
    process.exit(1);
  }

  const dirExists = fs.existsSync(dir);
  if (!dirExists) {
    console.error(`Directory ${dir} does not exist`);
    process.exit(1);
  }

  /* just an aside to myself but this stuff above is kind of gross and i should fix it */
  const repo = new Repo({
    network: test ? [] : [new BrowserWebSocketClientAdapter(syncServerUrl)],
    enableRemoteHeadsGossiping: true,
  });

  repo.subscribeToRemotes([syncServerStorageId]);

  const t = Date.now();

  switch (mainOptions.action) {
    case "branch": {
      await listBranches(repo, args);
      break;
    }
    case "activate": {
      await activateBranch(repo, args);
      break;
    }
    case "push":
      await push(repo, args);
      break;

    case "pull":
      await pull(repo, args);
      break;

    case "run": {
      await run(repo, {
        ...args,
        command:
          "_unknown" in args ? (args._unknown as string[]).join(" ") : command,
      });
      break;
    }

    case "refresh": {
      await refresh(repo, args);
      break;
    }

    case "watch": {
      await watch(repo, args);
      break;
    }

    case "watch-requests": {
      await watchRefreshRequests(repo, args);
      break;
    }

    default:
      console.error(`unknown command: ${mainOptions.action}`);
      process.exit(1);
  }

  const duration = Date.now() - t;

  console.log(`Done! (${duration} ms)`);
  process.exit(0);
};

main();
