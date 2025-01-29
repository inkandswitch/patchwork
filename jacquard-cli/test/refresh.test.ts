import { Repo } from "@automerge/automerge-repo";
import debug from "debug";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { FolderDoc } from "@patchwork/folder";
import { FileDoc } from "@patchwork/file";
import { CommandLineArgs } from "../src";
import { pull } from "../src/pull";
import { refresh } from "../src/refresh";
import { run } from "../src/run";
import {
  createPatchworkFolder,
  createUnixFolder,
  makeRepo,
  readUnixFolder,
} from "./utils";

describe("refresh", () => {
  let repo: Repo;
  beforeEach(() => {
    repo = makeRepo();
    debug.enable("jacquard-cli:*");
  });

  it("works in the simplest case", async () => {
    const folderUrl = createPatchworkFolder(
      {
        title: "My folder",
        docs: [
          {
            name: "input.txt",
            type: "file",
            url_linksTo: {
              name: "input.txt",
              type: "txt",
              content: { type: "text", value: "hello world" },
            },
          },
        ],
      },
      repo
    );

    const tempDir = await createUnixFolder([]);

    await pull(repo, {
      dir: tempDir,
      projectFolderUrl: folderUrl,
    } as CommandLineArgs);

    await run(
      repo,
      {
        command: "cat input.txt input.txt > output.txt",
        autoDeps: { stdoutDeclared: false, latex: false },
        explicitInputs: ["input.txt"],
        explicitOutputs: ["output.txt"],
      },
      { dir: tempDir, projectFolderUrl: folderUrl } as CommandLineArgs,
      false
    );

    expect(await readUnixFolder(tempDir)).toEqual([
      {
        fileName: "input.txt",
        content: "hello world",
      },
      {
        fileName: "output.txt",
        content: "hello worldhello world",
      },
    ]);

    const folderHandle = await repo.find<FolderDoc>(folderUrl);
    const folderDoc = folderHandle.doc();
    assert(folderDoc);
    const inputUrl = folderDoc.docs[0].url;
    const inputHandle = await repo.find<FileDoc>(inputUrl);
    inputHandle.change((d) => (d.content = "sup cosmos"));

    await pull(repo, {
      dir: tempDir,
      projectFolderUrl: folderUrl,
    } as CommandLineArgs);

    expect(await readUnixFolder(tempDir)).toEqual([
      {
        fileName: "input.txt",
        content: "sup cosmos",
      },
      {
        fileName: "output.txt",
        content: "hello worldhello world",
      },
    ]);

    await refresh(
      repo,
      {
        dir: tempDir,
        projectFolderUrl: folderUrl,
      } as CommandLineArgs,
      false
    );

    expect(await readUnixFolder(tempDir)).toEqual([
      {
        fileName: "input.txt",
        content: "sup cosmos",
      },
      {
        fileName: "output.txt",
        content: "sup cosmossup cosmos",
      },
    ]);
  });
});
