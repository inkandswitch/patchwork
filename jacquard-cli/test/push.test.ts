import { describe, expect, it } from "vitest";
import { FileDoc } from "@patchwork/file";
import { CommandLineArgs } from "../src";
import { push } from "../src/push";
import {
  PatchworkFolderSpec,
  UnixFolderContentsSpec,
  binaryData,
  createPatchworkFolder,
  createUnixFolder,
  makeRepo,
  readPatchworkFolder,
} from "./utils";

async function checkPush({
  beforeUnix,
  beforePatchwork,
  expectedChange,
}: {
  beforeUnix: UnixFolderContentsSpec;
  beforePatchwork: PatchworkFolderSpec;
  expectedChange: (spec: PatchworkFolderSpec) => void;
}) {
  // unix folder
  const tempDir = await createUnixFolder(beforeUnix);

  // patchwork folder
  const repo = makeRepo();
  const folderUrl = createPatchworkFolder(beforePatchwork, repo);

  // push
  await push(
    repo,
    {
      dir: tempDir,
      projectFolderUrl: folderUrl,
    } as CommandLineArgs,
    undefined,
    false
  );

  // check
  expectedChange(beforePatchwork);
  expect(await readPatchworkFolder(folderUrl, repo)).toEqual(beforePatchwork);
}

describe("push", () => {
  it("works pushing a text file", async () => {
    await checkPush({
      beforeUnix: [
        {
          fileName: "test.txt",
          content: "hello world",
        },
      ],
      beforePatchwork: {
        title: "My folder",
        docs: [],
      },
      expectedChange: (spec) => {
        spec.docs.push({
          name: "test.txt",
          type: "file",
          url_linksTo: {
            name: "test.txt",
            type: "txt",
            content: { type: "text", value: "hello world" },
          },
        });
      },
    });
  });

  it("works pushing a text file onto an existing file", async () => {
    await checkPush({
      beforeUnix: [
        {
          fileName: "test.txt",
          content: "hello world v2.0",
        },
      ],
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
      expectedChange: (spec) => {
        (spec.docs[0].url_linksTo as FileDoc).content = "hello world v2.0";
      },
    });
    // TODO: would be nice to double-check that the change is minimal
  });

  it("works pushing a nested text file", async () => {
    await checkPush({
      beforeUnix: [
        {
          fileName: "subdir",
          content: [
            {
              fileName: "nested.txt",
              content: "hello world",
            },
          ],
        },
      ],
      beforePatchwork: {
        title: "My folder",
        docs: [],
      },
      expectedChange: (spec) => {
        spec.docs.push({
          name: "subdir",
          type: "folder",
          url_linksTo: {
            title: "subdir",
            docs: [
              {
                name: "nested.txt",
                type: "file",
                url_linksTo: {
                  name: "nested.txt",
                  type: "txt",
                  content: { type: "text", value: "hello world" },
                },
              },
            ],
          } as PatchworkFolderSpec,
        });
      },
    });
  });

  it.skipIf(import.meta.env.OFFLINE)(
    "works pushing a binary file",
    async () => {
      await checkPush({
        beforeUnix: [
          {
            fileName: "test.jpg",
            content: binaryData,
          },
        ],
        beforePatchwork: {
          title: "My folder",
          docs: [],
        },
        expectedChange: (spec) => {
          spec.docs.push({
            name: "test.jpg",
            type: "file",
            url_linksTo: {
              name: "test.jpg",
              type: "jpg",
              content: { type: "link", url_linksTo: binaryData },
            },
          });
        },
      });
    }
  );

  it("works pushing a markdown file", async () => {
    await checkPush({
      beforeUnix: [
        {
          fileName: "test.md",
          content: "hello world",
        },
      ],
      beforePatchwork: {
        title: "My folder",
        docs: [],
      },
      expectedChange: (spec) => {
        spec.docs.push({
          name: "test.md",
          type: "essay",
          url_linksTo: {
            content: "hello world",
            fileName: "test.md",
          },
        });
      },
    });
  });
});
