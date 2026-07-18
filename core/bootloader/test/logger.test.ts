import { afterEach, describe, expect, it } from "vitest";
import { formatLogEntries, RingLogger } from "../src/logger.js";

/**
 * Runs in the node environment, where `indexedDB` is undefined — so the logger
 * exercises its in-memory degraded path (persistence is covered by the e2e
 * harness in a real browser). These tests pin the always-on capture, bounded
 * rings, drop accounting, and never-throw contract.
 */

const loggers: RingLogger[] = [];
function makeLogger(name = "test"): RingLogger {
  const logger = new RingLogger(name);
  loggers.push(logger);
  return logger;
}

afterEach(() => {
  for (const logger of loggers.splice(0)) logger.dispose();
});

describe("RingLogger", () => {
  it("captures entries with level, context and serialized args", async () => {
    const logger = makeLogger("worker");
    logger.record("warn", ["something", { a: 1 }]);

    const { entries } = await logger.readForExport();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: "warn", context: "worker" });
    expect(entries[0].args).toEqual(["something", '{"a":1}']);
  });

  it("serializes Errors to their stack/message and never throws on bad args", () => {
    const logger = makeLogger();
    expect(() => logger.record("error", [new Error("boom")])).not.toThrow();

    // Circular structure must not throw (JSON.stringify would).
    const circular: any = {};
    circular.self = circular;
    expect(() => logger.record("log", [circular])).not.toThrow();

    const [first] = logger.recent();
    expect(first.args[0]).toContain("boom");
  });

  it("bounds the in-memory buffer and counts drops", async () => {
    const logger = makeLogger();
    const total = 6_000; // exceeds the 5_000 in-memory cap
    for (let i = 0; i < total; i++) logger.record("log", [`line ${i}`]);

    const { entries, dropped } = await logger.readForExport();
    expect(entries.length).toBe(5_000);
    expect(dropped).toBe(total - 5_000);
    // The newest entries are retained; the oldest are evicted.
    expect(entries[entries.length - 1].args[0]).toBe("line 5999");
  });

  it("returns entries sorted and deduped by session:n", async () => {
    const logger = makeLogger();
    logger.record("log", ["a"]);
    logger.record("log", ["b"]);
    logger.record("log", ["c"]);

    const { entries } = await logger.readForExport();
    const ns = entries.map((e) => e.n);
    expect(ns).toEqual([...ns].sort((x, y) => x - y));
    expect(new Set(entries.map((e) => `${e.session}:${e.n}`)).size).toBe(
      entries.length
    );
  });

  it("formats entries as readable log lines", () => {
    const body = formatLogEntries([
      {
        session: "s",
        n: 1,
        ts: 0,
        level: "info",
        context: "tab",
        args: ["hello", "world"],
      },
    ]);
    expect(body).toBe("1970-01-01T00:00:00.000Z [info] (tab) hello world");
  });
});
