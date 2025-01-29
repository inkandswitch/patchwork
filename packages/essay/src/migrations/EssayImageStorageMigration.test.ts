import { describe, it, expect, beforeEach } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import { MarkdownDoc } from "../datatype";
import { EssayImageStorageMigration } from "./EssayImageStorageMigration";

describe("EssayImageStorageMigration", () => {
  let repo: Repo;
  let essayHandle: any;
  let assetsHandle: any;
  let migration: EssayImageStorageMigration;

  beforeEach(() => {
    repo = new Repo({
      network: [],
      storage: undefined,
    });

    // Create test essay
    essayHandle = repo.create<MarkdownDoc>();
    assetsHandle = repo.create();
    migration = new EssayImageStorageMigration();

    // Initialize test data
    essayHandle.change((doc: MarkdownDoc) => {
      doc.content =
        "# Test\n\n![test](./assets/test.png)\n![another](./assets/image.jpg)";
      (doc as any).assetsDocUrl = assetsHandle.url;
    });

    assetsHandle.change((doc: any) => {
      doc.files = {
        "test.png": {
          contentType: "image/png",
          contents: new Uint8Array([1, 2, 3]),
        },
        "image.jpg": {
          contentType: "image/jpeg",
          contents: new Uint8Array([4, 5, 6]),
        },
      };
    });
  });

  it("should migrate images to new format", async () => {
    await migration.runMigration(essayHandle, repo);

    const essay = essayHandle.doc();
    expect(essay.content).toMatch(/\!\[test\]\(\.\/automerge\/[a-zA-Z0-9]+\)/);
    expect(essay.content).toMatch(
      /\!\[another\]\(\.\/automerge\/[a-zA-Z0-9]+\)/
    );
  });

  it("should create file documents with correct content", async () => {
    await migration.runMigration(essayHandle, repo);

    const essay = essayHandle.doc();
    const fileUrls = essay.content.match(/automerge:[a-zA-Z0-9]+/g) || [];

    for (const url of fileUrls) {
      const fileHandle = await repo.find<any>(url);
      const fileDoc = fileHandle.doc();
      expect(fileDoc).toBeDefined();
      expect(fileDoc?.content.type).toBe("binary");
    }
  });
});
