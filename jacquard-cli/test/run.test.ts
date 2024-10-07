import { Repo } from "@automerge/automerge-repo";
import debug from "debug";
import { beforeEach, describe, expect, it } from "vitest";
import { CommandLineArgs } from "../src";
import { pull } from "../src/pull";
import { run } from "../src/run";
import {
  createPatchworkFolder,
  createUnixFolder,
  makeRepo,
  readPatchworkFolder,
  readUnixFolder,
} from "./utils";

describe("run", () => {
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

    expect(await readPatchworkFolder(folderUrl, repo)).toEqual({
      docs: [
        {
          name: "input.txt",
          type: "file",
          url_linksTo: {
            content: {
              type: "text",
              value: "hello world",
            },
            name: "input.txt",
            type: "txt",
          },
        },
        {
          name: "output.txt",
          type: "file",
          url_linksTo: {
            content: {
              type: "text",
              value: "hello worldhello world",
            },
            name: "output.txt",
            type: "txt",
          },
        },
        {
          name: "Build Metadata",
          type: "jacquard-build-metadata",
          url_linksTo: {
            title: "Build Metadata",
            buildRuns: [
              {
                id: expect.any(String),
                inputs: [
                  {
                    // TODO: would be nice to check that the url is
                    // actually right
                    docUrl: expect.any(String),
                    heads: [expect.any(String)],
                    path: "input.txt",
                  },
                ],
                outputs: [
                  {
                    // TODO: would be nice to check that the url is
                    // actually right
                    docUrl: expect.any(String),
                    heads: [expect.any(String)],
                    path: "output.txt",
                  },
                ],
                spec: {
                  autoDeps: {
                    latex: false,
                    stdoutDeclared: false,
                  },
                  command: "cat input.txt input.txt > output.txt",
                  explicitInputs: ["input.txt"],
                  explicitOutputs: ["output.txt"],
                },
                duration: expect.any(Number),
                timestamp: expect.any(Number),
              },
            ],
            projectFolderUrl: expect.any(String),
            refreshState: {
              type: "idle",
            },
          },
        },
      ],
      title: "My folder",
    });
  });
});
