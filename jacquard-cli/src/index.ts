#!/usr/bin/env bun

import fs from "fs";
import commandLineArgs from "command-line-args";
import path from "path";

import { AutomergeUrl, Repo, StorageId } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

import { push } from "./push";
import { pull } from "./pull";
import { run } from "./run";
import { latex } from "./latex";
import { listBranches } from "./branch";
import { activateBranch } from "./activate";
import { refresh } from "./refresh";
import { getJacquardConfig } from "./util";

export type CommandLineArgs = {
  dir: string;
  projectFolderUrl?: AutomergeUrl;
  test?: boolean;
  syncServerUrl?: string;
  syncServerStorageId?: StorageId;
  patchworkUrl?: string;
  inputs?: string[];
  outputs?: string[];
  command?: string;
  branchUrl?: string;
};

const main = async () => {
  const mainDefinitions = [{ name: "action", defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });

  const argv = mainOptions._unknown || [];

  const allFlags = [
    { name: "dir", type: String, defaultValue: "." },
    { name: "projectFolderUrl", type: String },
    { name: "branchUrl", type: String },
    { name: "test", type: Boolean, defaultValue: false },
    {
      name: "syncServerUrl",
      type: String,
    },
    {
      name: "syncServerStorageId",
      type: String,
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
  ];

  const jacquardConfig = getJacquardConfig();

  const options = commandLineArgs(allFlags, {
    argv,
    stopAtFirstUnknown:
      mainOptions.action === "run" || mainOptions.action === "latex", // allow run and latex to have rest arguments
  }) as CommandLineArgs;

  const {
    dir,
    test,
    projectFolderUrl = jacquardConfig?.projectFolderUrl,
    syncServerUrl = jacquardConfig?.syncServer?.url ??
      "wss://sync.automerge.org",
    syncServerStorageId = jacquardConfig?.syncServer
      ? jacquardConfig.syncServer.storageId
      : "3760df37-a4c6-4f66-9ecd-732039a9385d",
    patchworkUrl,
    inputs,
    outputs,
    command,
    branchUrl,
  } = options;

  const activeBranch = jacquardConfig?.activeBranch ?? { type: "main" };

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
      await listBranches(repo, { projectFolderUrl });
      break;
    }
    case "activate": {
      await activateBranch(repo, { projectFolderUrl, branchUrl, dir });
      break;
    }
    case "push":
      await push(repo, {
        dir,
        projectFolderUrl,
        syncServerStorageId,
        patchworkUrl,
      });
      break;

    case "pull":
      await pull(repo, { dir, projectFolderUrl });
      break;

    case "run": {
      await run(repo, {
        dir,
        projectFolderUrl,
        patchworkUrl,
        inputs,
        outputs,
        command:
          "_unknown" in options
            ? (options._unknown as string[]).join(" ")
            : command,
      });
      break;
    }

    case "refresh": {
      await refresh(repo, { dir, projectFolderUrl });
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
