import { describe, expect, it } from "vitest";
import { decodeStoreDump, encodeRecords } from "../src/idb-dump.js";

/**
 * The raw-IDB framing is the correctness- and security-critical part of the
 * diagnostics bundle: it must reproduce binary document chunks byte-for-byte,
 * survive JSON serialization of the index (it ships as `index.json`), and never
 * silently base64-bloat or corrupt bytes.
 */

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

/** Round-trip through the index JSON exactly as the zip write/read would. */
function roundTrip(records: Array<{ key: unknown; value: unknown }>) {
  const { records: encoded, bin } = encodeRecords(records);
  const indexJson = JSON.parse(JSON.stringify({ records: encoded }));
  return decodeStoreDump(indexJson.records, bin);
}

describe("idb-dump framing", () => {
  it("round-trips the automerge storage record shape byte-for-byte", () => {
    const records = [
      {
        key: ["2uZrhZ7G2NJxryZSMWSdDNFCke8C", "snapshot", "abc"],
        value: {
          key: ["2uZrhZ7G2NJxryZSMWSdDNFCke8C", "snapshot", "abc"],
          binary: bytes(0, 1, 2, 127, 128, 200, 255),
        },
      },
      {
        key: ["2uZrhZ7G2NJxryZSMWSdDNFCke8C", "incremental", "def"],
        value: {
          key: ["2uZrhZ7G2NJxryZSMWSdDNFCke8C", "incremental", "def"],
          binary: bytes(255, 254, 0, 42),
        },
      },
    ];

    const decoded = roundTrip(records);

    expect(decoded).toEqual(records);
    // Specifically assert the bytes are identical (not base64 strings).
    expect(decoded[0].value).toMatchObject({
      binary: bytes(0, 1, 2, 127, 128, 200, 255),
    });
    expect((decoded[1].value as any).binary).toBeInstanceOf(Uint8Array);
  });

  it("concatenates binaries without overlap and slices them back exactly", () => {
    const a = bytes(1, 2, 3);
    const b = bytes(9, 8, 7, 6);
    const { records, bin } = encodeRecords([
      { key: "a", value: a },
      { key: "b", value: b },
    ]);

    // Two distinct, non-overlapping slices of the single concatenated buffer.
    expect(records[0].value).toEqual({ $bin: [0, 3] });
    expect(records[1].value).toEqual({ $bin: [3, 4] });
    expect(bin.byteLength).toBe(7);

    const decoded = decodeStoreDump(records, bin);
    expect(decoded[0].value).toEqual(a);
    expect(decoded[1].value).toEqual(b);
  });

  it("handles nested binary, arrays, Date, bigint, Map and Set", () => {
    const records = [
      {
        key: 1,
        value: {
          nested: { deep: bytes(10, 20, 30) },
          list: [bytes(1), bytes(2, 2)],
          when: new Date("2026-06-24T12:00:00.000Z"),
          big: 9007199254740993n,
          map: new Map<string, unknown>([["k", bytes(5, 5)]]),
          set: new Set([1, 2, 3]),
          str: "hello",
          n: 42,
          flag: true,
          nothing: null,
        },
      },
    ];

    const decoded = roundTrip(records) as any;
    expect(decoded[0].value.nested.deep).toEqual(bytes(10, 20, 30));
    expect(decoded[0].value.list).toEqual([bytes(1), bytes(2, 2)]);
    expect(decoded[0].value.when).toEqual(new Date("2026-06-24T12:00:00.000Z"));
    expect(decoded[0].value.big).toBe(9007199254740993n);
    expect(decoded[0].value.map).toEqual(new Map([["k", bytes(5, 5)]]));
    expect(decoded[0].value.set).toEqual(new Set([1, 2, 3]));
    expect(decoded[0].value.str).toBe("hello");
  });

  it("preserves binary primary keys (out-of-line keys can be binary)", () => {
    const records = [{ key: bytes(0xde, 0xad, 0xbe, 0xef), value: "x" }];
    const decoded = roundTrip(records);
    expect(decoded[0].key).toEqual(bytes(0xde, 0xad, 0xbe, 0xef));
  });

  it("truncates at the byte cap and flags it", () => {
    const big = new Uint8Array(1000);
    const result = encodeRecords(
      [
        { key: 1, value: big },
        { key: 2, value: big },
        { key: 3, value: big },
      ],
      1500
    );
    // First record fits (0 bytes used at start); after it we're past the cap.
    expect(result.truncated).toBe(true);
    expect(result.records.length).toBeLessThan(3);
  });

  it("never emits base64 — the index JSON contains only $bin offset refs", () => {
    const { records } = encodeRecords([
      { key: "k", value: bytes(1, 2, 3, 4, 5) },
    ]);
    const json = JSON.stringify(records);
    expect(json).toContain("$bin");
    // A base64 of these bytes would be "AQIDBAU="; assert it isn't present.
    expect(json).not.toContain("AQIDBAU");
  });
});
