import { describe, expect, it } from "vitest";
import { isAutomergeKey, isSubductionKey } from "../src/idb-maintenance.js";

/**
 * These predicates are the safety gates for the destructive drops: each must
 * match only its own namespace and never the other's, so a drop can't take out
 * the records it's meant to preserve. (The signer and logs live in separate
 * databases the drops never open, so the predicates are the whole risk.)
 */

const subductionKeys = [
  ["subduction", "commits", "tree", "hash"],
  ["subduction", "blobs", "x"],
  ["subduction", "fragments", "x"],
  ["subduction", "fragment-blobs", "x"],
  ["subduction", "remote-heads", "x"],
  ["subduction", "ids", "x"],
  ["subduction"],
];

const automergeKeys = [
  ["2uZrhZ7G2NJxryZSMWSdDNFCke8C", "snapshot", "h"],
  ["docId", "incremental", "h"],
  ["docId", "sync-state", "x"],
];

const neither = [
  ["storage-adapter-id"],
  [],
  null,
  undefined,
  "subduction",
  ["Subduction", "commits"], // case-sensitive
  ["subductionish", "x"], // exact first-segment match only
  ["docId", "unknown-kind", "h"],
];

describe("isSubductionKey", () => {
  it("matches every Subduction record shape", () => {
    for (const k of subductionKeys) expect(isSubductionKey(k)).toBe(true);
  });
  it("rejects Automerge chunks and everything else", () => {
    for (const k of [...automergeKeys, ...neither])
      expect(isSubductionKey(k)).toBe(false);
  });
});

describe("isAutomergeKey", () => {
  it("matches Automerge document chunks", () => {
    for (const k of automergeKeys) expect(isAutomergeKey(k)).toBe(true);
  });
  it("rejects Subduction records and everything else", () => {
    for (const k of [...subductionKeys, ...neither])
      expect(isAutomergeKey(k)).toBe(false);
  });
});

describe("the two predicates are disjoint", () => {
  it("never both match the same key", () => {
    for (const k of [...subductionKeys, ...automergeKeys, ...neither])
      expect(isSubductionKey(k) && isAutomergeKey(k)).toBe(false);
  });
});
