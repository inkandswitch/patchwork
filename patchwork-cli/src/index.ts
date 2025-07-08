#!/usr/bin/env bun
/*
  use this line to inspect the CLI with a debugger
  #!/usr/bin/env bun --inspect-wait
*/

import commandLineArgs from "command-line-args";
import fs from "fs";
import path from "path";
import process from "process";

import { registerPlugins, isPlugin, Plugin } from "@patchwork/sdk";
import { AutomergeUrl, Repo, StorageId } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";

import { activateBranch } from "./activate";
import { listBranches } from "./branch";
import { pull } from "./pull";
import { push } from "./push";
import { getPatchworkConfig } from "./util";
import { login } from "./login";
import { install } from "./install";
import { logout } from "./logout";
import { whoami } from "./whoami";

// those marked non-optional here are those with defaults provided in allFlags below
export type CommandLineArgs = {
  dir: string;
  projectFolderUrl?: AutomergeUrl;
  parentFolderUrl?: AutomergeUrl;
  test: boolean;
  syncServerUrl: string;
  syncServerStorageId: StorageId;
  patchworkUrl: string;
  inputs?: string[];
  outputs?: string[];
  command?: string;
  branchUrl?: string;
  runPrefix?: string;
  latexDeps: boolean;
  stdoutDeclaredDeps: boolean;
  name?: string;
  accountUrl?: AutomergeUrl;
  moduleUrl?: AutomergeUrl;
};

const main = async () => {
  const mainDefinitions = [{ name: "action", defaultOption: true }];
  const mainOptions = commandLineArgs(mainDefinitions, {
    stopAtFirstUnknown: true,
  });

  const argv = mainOptions._unknown || [];

  const patchworkConfig = getPatchworkConfig();

  const allFlags: commandLineArgs.OptionDefinition[] = [
    { name: "dir", type: String, defaultValue: "." },
    {
      name: "projectFolderUrl",
      type: String,
      defaultValue: patchworkConfig?.projectFolderUrl,
    },
    { name: "parentFolderUrl", type: String },
    { name: "branchUrl", type: String },
    { name: "test", type: Boolean, defaultValue: false },
    {
      name: "syncServerUrl",
      type: String,
      defaultValue:
        patchworkConfig?.syncServer?.url ?? "wss://sync3.automerge.org",
    },
    {
      name: "syncServerStorageId",
      type: String,
      defaultValue:
        patchworkConfig?.syncServer?.storageId ??
        ("3760df37-a4c6-4f66-9ecd-732039a9385d" as StorageId),
    },
    {
      name: "patchworkUrl",
      type: String,
      defaultValue: "https://patchwork.inkandswitch.com",
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
      defaultValue: patchworkConfig?.runPrefix,
    },
    {
      name: "latexDeps",
      type: Boolean,
      defaultValue: false,
    },
    {
      name: "stdoutDeclaredDeps",
      type: Boolean,
      defaultValue: false,
    },
    {
      name: "name",
      type: String,
    },
    { name: "accountUrl", type: String },
    { name: "moduleUrl", type: String },
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

  // TODO: i have a branch where i'm using the module-watcher to load plugins that we should switch to
  //       so i'm just going to leave this here for now

  // Gotta get all the datatypes loaded before we can do much of anything
  const dataTypes = {
    file: "@patchwork/file",
    folder: "@patchwork/folder",
    essay: "@patchwork/essay",
  };

  await Promise.all([
    ...Object.entries(dataTypes).map(async ([id, importName]) => {
      const module = await import(importName);
      // Modern modules should export plugins like this:
      // export const plugins = [plugin1, plugin2]
      // but this code handles backwards compatibility for the old way like this:
      // export const tools = [tool1, tool2]
      // export const dataTypes = [dataType1, dataType2]
      // ...
      const plugins: Plugin[] = Object.values(module).flatMap(
        (value): Plugin[] => {
          if (isPlugin(value)) {
            return [value as unknown as Plugin];
          }
          if (Array.isArray(value)) {
            return value.filter((v): v is Plugin => isPlugin(v)) as Plugin[];
          }
          return [];
        }
      );
      await registerPlugins(plugins, importName);
    }),
  ]);

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

    case "login": {
      await login(repo, args);
      break;
    }

    case "logout": {
      await logout(repo, args);
      break;
    }

    case "whoami": {
      await whoami(repo, args);
      break;
    }

    case "install": {
      await install(repo, args);
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
