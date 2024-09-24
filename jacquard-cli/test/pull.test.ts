import { describe, expect, it } from "vitest";
import { FileDoc } from "../../packages/file/src/datatype";
import { CommandLineArgs } from "../src";
import { push } from "../src/push";
import {
  PatchworkFolderSpec,
  UnixFolderContentsSpec,
  binaryData,
  checkPatchworkFolder,
  createPatchworkFolder,
  createUnixFolder,
  makeRepo,
  readUnixFolder,
} from "./utils";
import { pull } from "../src/pull";

async function checkPull({
  beforePatchwork,
  beforeUnix,
  expectedChange,
}: {
  beforePatchwork: PatchworkFolderSpec;
  beforeUnix: UnixFolderContentsSpec;
  expectedChange: (spec: UnixFolderContentsSpec) => void;
}) {
  // patchwork folder
  const repo = makeRepo();
  const folderUrl = createPatchworkFolder(beforePatchwork, repo);

  // unix folder
  const tempDir = await createUnixFolder(beforeUnix);

  // pull
  await pull(repo, {
    dir: tempDir,
    projectFolderUrl: folderUrl,
  } as CommandLineArgs);

  expectedChange(beforeUnix);
  const actual = await readUnixFolder(tempDir);
  expect(actual).toEqual(beforeUnix);
}

describe("pull", () => {
  it("works pulling a text file", async () => {
    await checkPull({
      beforePatchwork: {
        title: "My folder",
        docs: [
          {
            name: "test.txt",
            type: "file",
            url_linksTo: {
              name: "test.txt",
              type: "txt",
              content: { type: "text", value: "hello world" },
            },
          },
        ],
      },
      beforeUnix: [],
      expectedChange: (spec) => {
        spec.push({
          fileName: "test.txt",
          content: "hello world",
        });
      },
    });
  });

  it("works pulling an essay (without a filename set)", async () => {
    await checkPull({
      beforePatchwork: {
        title: "My folder",
        docs: [
          {
            name: "My nice essay",
            type: "essay",
            url_linksTo: {
              content: "# My Essay\n\nHello world",
            },
          },
        ],
      },
      beforeUnix: [],
      expectedChange: (spec) => {
        spec.push({
          fileName: "My nice essay",
          content: "# My Essay\n\nHello world",
        });
      },
    });
  });

  it("works pulling an essay (with a filename set)", async () => {
    await checkPull({
      beforePatchwork: {
        title: "My folder",
        docs: [
          {
            name: "My nice essay",
            type: "essay",
            url_linksTo: {
              content: "# My Essay\n\nHello world",
              unixFileName: "secret-filename.md",
            },
          },
        ],
      },
      beforeUnix: [],
      expectedChange: (spec) => {
        spec.push({
          fileName: "secret-filename.md",
          content: "# My Essay\n\nHello world",
        });
      },
    });
  });
});
