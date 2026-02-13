/// <reference lib="webworker" />

import type { ChangeMetadata } from "@automerge/automerge";
import type { HistoryChange, HistoryItem } from "../types";
import {
  applyGroupingStrategy,
  configFromStrategyKey,
} from "../grouping/strategies";

export interface FullHistoryRequest {
  allMeta: ChangeMetadata[];
  allHashes: string[];
  strategyKey: string;
}

export interface FullHistoryResponse {
  items: HistoryItem[];
}

declare const self: DedicatedWorkerGlobalScope;
export {};

// Forward console logs to the main thread via BroadcastChannel
const logChannel = new BroadcastChannel("computeFullHistory-worker-logs");

function log(level: string, args: any[]) {
  try {
    logChannel.postMessage({
      type: "log",
      level,
      args: args.map((a) =>
        a instanceof Error
          ? { message: a.message, stack: a.stack }
          : typeof a === "object"
            ? JSON.parse(JSON.stringify(a))
            : a
      ),
    });
  } catch {
    // ok
  }
}

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

console.log = (...args) => {
  originalConsole.log(...args);
  log("log", args);
};
console.warn = (...args) => {
  originalConsole.warn(...args);
  log("warn", args);
};
console.error = (...args) => {
  originalConsole.error(...args);
  log("error", args);
};

// @ts-expect-error onerror signature mismatch
self.onerror = (event, source, lineno, colno, error) => {
  log("error", [
    "[computeFullHistory worker: ERROR]",
    {
      event,
      source,
      lineno,
      colno,
      error: error?.message,
      stack: error?.stack,
    },
  ]);
};

self.onunhandledrejection = (event) => {
  log("error", [
    "[computeFullHistory worker: UNHANDLED REJECTION]",
    String(event.reason),
  ]);
};

console.log("[computeFullHistory worker] loaded");

self.onmessage = (event: MessageEvent<FullHistoryRequest>) => {
  const { allMeta, strategyKey } = event.data;
  console.log("[computeFullHistory worker] received message:", {
    metaCount: allMeta.length,
    strategyKey,
  });

  // Reverse to get newest first
  allMeta.reverse();

  // Convert to history changes
  const historyChanges: HistoryChange[] = allMeta.map((meta, index) => {
    const beforeHead = allMeta[index + 1]?.hash;
    const change: HistoryChange = {
      hash: meta.hash,
      metadata: meta,
    };
    if (beforeHead) {
      change.beforeHead = beforeHead;
    }
    return change;
  });

  // Apply grouping strategy
  const config = configFromStrategyKey(strategyKey);
  const items = applyGroupingStrategy(config, historyChanges);

  console.log("[computeFullHistory worker] posting response:", {
    itemCount: items.length,
  });
  self.postMessage({ items } satisfies FullHistoryResponse);
};
