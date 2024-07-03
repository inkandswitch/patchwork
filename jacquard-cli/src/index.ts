#!/usr/bin/env bun

import fs from "fs";
import commandLineArgs from "command-line-args";
import path from "path";

import { AutomergeUrl, Repo, StorageId } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

// import { pull } from "./pull";
import { push } from "./push";
import { run } from "./run";

export type CommandLineArgs = {
  dir: string;
  automergeDocUrl?: AutomergeUrl;
  test?: boolean;
  syncServerUrl?: string;
  syncServerStorageId?: StorageId;
  patchworkUrl?: string;
  inputs?: string[];
  outputs?: string[];
  command?: string;
};

const main = async () => {
  const mainDefinitions = [{ name: "action", defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });

  const argv = mainOptions._unknown || [];

  const allFlags = [
    { name: "dir", type: String, defaultValue: "." },
    { name: "automergeDocUrl", type: String },
    { name: "test", type: Boolean, defaultValue: false },
    {
      name: "syncServerUrl",
      type: String,
      defaultValue: "ws://localhost:3030",
      //defaultValue: "wss://sync.automerge.org",
    },
    {
      name: "syncServerStorageId",
      type: String,
      defaultValue: "3760df37-a4c6-4f66-9ecd-732039a9385d",
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

  const options = commandLineArgs(allFlags, {
    argv,
  }) as CommandLineArgs;

  let jacquardConfig = getJaquardConfig();

  const {
    dir,
    test,
    automergeDocUrl = jacquardConfig?.projectFolderUrl,
    syncServerUrl,
    syncServerStorageId,
    patchworkUrl,
    inputs,
    outputs,
    command,
  } = options;

  if (!automergeDocUrl && mainOptions.command == "pull") {
    console.error("No URL specified: use --automergeDocUrl <url>");
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

  if (mainOptions.action === "push") {
    await push(repo, {
      dir,
      automergeDocUrl,
      syncServerStorageId,
      patchworkUrl,
    });
  } else if (mainOptions.action === "pull") {
    console.log("not implemented");
    //await pull({ repo, dir, automergeDocUrl });
  } else if (mainOptions.action === "run") {
    await run(repo, {
      dir,
      automergeDocUrl,
      patchworkUrl,
      inputs,
      outputs,
      command,
    });
  }

  const duration = Date.now() - t;

  console.log(`Done! (${duration} ms)`);
  process.exit(0);
};

const getJaquardConfig = () => {
  const currentDir = process.cwd();

  const configFilePath = path.join(currentDir, "jacquard.json");

  if (fs.existsSync(configFilePath)) {
    try {
      const configFileContents = fs.readFileSync(configFilePath, "utf8");
      return JSON.parse(configFileContents);
    } catch (error) {
      console.warn("invalid jacquare.json file");
      return null;
    }
  } else {
    return null;
  }
};

main();
