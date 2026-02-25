#!/usr/bin/env node

import { Command } from "commander";
import {
  type AutomergeUrl,
  isValidAutomergeUrl,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { createRepo, findDoc, waitForSync } from "./repo.js";
import type { ModuleSettingsDoc, TagPointer } from "./types.js";

const program = new Command();

program
  .name("patchwork-modules")
  .description("Manage Patchwork module settings documents")
  .version("0.0.1");

function validateUrl(url: string): AutomergeUrl {
  if (!isValidAutomergeUrl(url)) {
    console.error(`Invalid Automerge URL: ${url}`);
    process.exit(1);
  }
  return url;
}

program
  .command("create")
  .description("Create a new module settings document")
  .action(async () => {
    const repo = await createRepo();
    const handle = repo.create<ModuleSettingsDoc>();
    handle.change((doc) => {
      doc.modules = {} as any;
      (doc as any)["@patchwork"] = { type: "patchwork:module-settings" };
    });
    console.log(`Created module settings document: ${handle.url}`);
    console.log("Waiting for sync...");
    await waitForSync();
    console.log("Done.");
    process.exit(0);
  });

program
  .command("list")
  .description("List all tools and tags")
  .argument("<modules-doc-url>", "Module settings document URL")
  .action(async (modulesDocUrl: string) => {
    const url = validateUrl(modulesDocUrl);
    const repo = await createRepo();
    const handle = await findDoc<ModuleSettingsDoc>(repo, url);
    const doc = handle.doc();

    if (!doc?.modules || typeof doc.modules !== "object") {
      console.log("No modules found (or document is in legacy format).");
      process.exit(0);
    }

    const entries = Object.entries(doc.modules) as [
      AutomergeUrl,
      { tags: Record<string, TagPointer> },
    ][];

    if (entries.length === 0) {
      console.log("No modules registered.");
      process.exit(0);
    }

    for (const [packageUrl, entry] of entries) {
      console.log(`\n${packageUrl}`);
      const tags = Object.entries(entry.tags ?? {});
      if (tags.length === 0) {
        console.log("  (no tags)");
      }
      for (const [tagName, pointer] of tags) {
        const headsStr = pointer.heads?.join(",") ?? "(none)";
        console.log(`  ${tagName}: ${headsStr}`);
      }
    }

    process.exit(0);
  });

program
  .command("add")
  .description("Add a tool package with a default tag at its current heads")
  .argument("<modules-doc-url>", "Module settings document URL")
  .argument("<package-url>", "Automerge URL of the tool package")
  .action(async (modulesDocUrl: string, packageUrl: string) => {
    const docUrl = validateUrl(modulesDocUrl);
    const pkgUrl = validateUrl(packageUrl);
    const repo = await createRepo();

    const pkgHandle = await findDoc<any>(repo, pkgUrl);
    const heads = pkgHandle.heads();

    const settingsHandle = await findDoc<ModuleSettingsDoc>(repo, docUrl);
    settingsHandle.change((doc) => {
      if (!doc.modules) doc.modules = {} as any;
      (doc.modules as any)[pkgUrl] = {
        tags: {
          default: { heads: [...heads] },
        },
      };
    });

    console.log(`Added ${pkgUrl} with default tag at heads: ${heads.join(",")}`);
    console.log("Waiting for sync...");
    await waitForSync();
    console.log("Done.");
    process.exit(0);
  });

program
  .command("remove")
  .description("Remove a tool from the modules document")
  .argument("<modules-doc-url>", "Module settings document URL")
  .argument("<package-url>", "Automerge URL of the tool package")
  .action(async (modulesDocUrl: string, packageUrl: string) => {
    const docUrl = validateUrl(modulesDocUrl);
    const pkgUrl = validateUrl(packageUrl);
    const repo = await createRepo();

    const settingsHandle = await findDoc<ModuleSettingsDoc>(repo, docUrl);
    settingsHandle.change((doc) => {
      if (doc.modules && (doc.modules as any)[pkgUrl]) {
        delete (doc.modules as any)[pkgUrl];
      }
    });

    console.log(`Removed ${pkgUrl}`);
    console.log("Waiting for sync...");
    await waitForSync();
    console.log("Done.");
    process.exit(0);
  });

program
  .command("tag")
  .description("Create or update a tag for a tool")
  .argument("<modules-doc-url>", "Module settings document URL")
  .argument("<package-url>", "Automerge URL of the tool package")
  .argument("<tag-name>", "Tag name (e.g. 'pvh-dev')")
  .option("--heads <heads>", "Comma-separated heads (defaults to current)")
  .action(
    async (
      modulesDocUrl: string,
      packageUrl: string,
      tagName: string,
      opts: { heads?: string }
    ) => {
      const docUrl = validateUrl(modulesDocUrl);
      const pkgUrl = validateUrl(packageUrl);
      const repo = await createRepo();

      let heads: string[];
      if (opts.heads) {
        heads = opts.heads.split(",");
      } else {
        const pkgHandle = await findDoc<any>(repo, pkgUrl);
        heads = [...pkgHandle.heads()];
      }

      const settingsHandle = await findDoc<ModuleSettingsDoc>(repo, docUrl);
      settingsHandle.change((doc) => {
        if (!doc.modules) doc.modules = {} as any;
        const entry = (doc.modules as any)[pkgUrl];
        if (!entry) {
          (doc.modules as any)[pkgUrl] = {
            tags: { [tagName]: { heads } },
          };
        } else {
          if (!entry.tags) entry.tags = {};
          entry.tags[tagName] = { heads };
        }
      });

      console.log(
        `Set tag "${tagName}" for ${pkgUrl} to heads: ${heads.join(",")}`
      );
      console.log("Waiting for sync...");
      await waitForSync();
      console.log("Done.");
      process.exit(0);
    }
  );

program
  .command("release")
  .description("Move the default tag to current (or specified) heads")
  .argument("<modules-doc-url>", "Module settings document URL")
  .argument("<package-url>", "Automerge URL of the tool package")
  .option("--heads <heads>", "Comma-separated heads (defaults to current)")
  .option(
    "--from <tag>",
    "Copy heads from another tag instead of the package"
  )
  .action(
    async (
      modulesDocUrl: string,
      packageUrl: string,
      opts: { heads?: string; from?: string }
    ) => {
      const docUrl = validateUrl(modulesDocUrl);
      const pkgUrl = validateUrl(packageUrl);
      const repo = await createRepo();

      let heads: string[];
      if (opts.heads) {
        heads = opts.heads.split(",");
      } else if (opts.from) {
        const settingsHandle = await findDoc<ModuleSettingsDoc>(repo, docUrl);
        const doc = settingsHandle.doc();
        const entry = (doc.modules as any)?.[pkgUrl];
        const sourceTag = entry?.tags?.[opts.from];
        if (!sourceTag?.heads) {
          console.error(
            `Tag "${opts.from}" not found for ${pkgUrl}`
          );
          process.exit(1);
        }
        heads = [...sourceTag.heads];
      } else {
        const pkgHandle = await findDoc<any>(repo, pkgUrl);
        heads = [...pkgHandle.heads()];
      }

      const settingsHandle = await findDoc<ModuleSettingsDoc>(repo, docUrl);
      settingsHandle.change((doc) => {
        if (!doc.modules) doc.modules = {} as any;
        const entry = (doc.modules as any)[pkgUrl];
        if (!entry) {
          (doc.modules as any)[pkgUrl] = {
            tags: { default: { heads } },
          };
        } else {
          if (!entry.tags) entry.tags = {};
          entry.tags.default = { heads };
        }
      });

      console.log(
        `Released ${pkgUrl}: default tag now at heads: ${heads.join(",")}`
      );
      console.log("Waiting for sync...");
      await waitForSync();
      console.log("Done.");
      process.exit(0);
    }
  );

program
  .command("status")
  .description("Show status of all tools (current heads vs tag pointers)")
  .argument("<modules-doc-url>", "Module settings document URL")
  .action(async (modulesDocUrl: string) => {
    const url = validateUrl(modulesDocUrl);
    const repo = await createRepo();
    const handle = await findDoc<ModuleSettingsDoc>(repo, url);
    const doc = handle.doc();

    if (!doc?.modules || typeof doc.modules !== "object") {
      console.log("No modules found.");
      process.exit(0);
    }

    const entries = Object.entries(doc.modules) as [
      AutomergeUrl,
      { tags: Record<string, TagPointer> },
    ][];

    for (const [packageUrl, entry] of entries) {
      let currentHeads: string[];
      try {
        const pkgHandle = await findDoc<any>(repo, packageUrl);
        currentHeads = [...pkgHandle.heads()];
      } catch {
        currentHeads = ["(unreachable)"];
      }

      console.log(`\n${packageUrl}`);
      console.log(`  latest: ${currentHeads.join(",")}`);

      for (const [tagName, pointer] of Object.entries(
        entry.tags ?? {}
      )) {
        const tagHeads = pointer.heads?.join(",") ?? "(none)";
        const upToDate =
          tagHeads === currentHeads.join(",") ? " (up to date)" : " (behind)";
        console.log(`  ${tagName}: ${tagHeads}${upToDate}`);
      }
    }

    process.exit(0);
  });

program.parse();
