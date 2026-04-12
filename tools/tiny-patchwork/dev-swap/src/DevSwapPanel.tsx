import { useState, useEffect, useCallback, useRef } from "react";
import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import type { ToolElement } from "@inkandswitch/patchwork-plugins";
import {
  devSwap,
  devUnswap,
  devRemove,
  restoreDevSwaps,
  loadDevSwaps,
  type DevSwapState,
} from "./dev-swap-engine";

const btnStyle: React.CSSProperties = {
  padding: "2px 8px",
  borderRadius: "3px",
  border: "none",
  background: "#555",
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px",
};

export function DevSwapPanel({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) {
  const repo = element.repo;
  const handleRef = useRef<DocHandle<any> | null>(null);
  const [swaps, setSwaps] = useState<DevSwapState>({});
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  const refresh = () => setSwaps(loadDevSwaps());

  // Resolve handle and restore swaps on mount + expose on window.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false;
    repo.find(docUrl).then((handle: any) => {
      if (cancelled) return;
      handleRef.current = handle;
      setReady(true);

      restoreDevSwaps(repo, handle, refresh).then(setSwaps);

      (window as any).devSwap = (url: AutomergeUrl) =>
        devSwap(repo, handle, url, refresh).then(setSwaps);
      (window as any).devUnswap = (url: AutomergeUrl) =>
        devUnswap(handle, url).then(setSwaps);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSwap = useCallback(async (url?: AutomergeUrl) => {
    const target = url || input.trim() as AutomergeUrl;
    if (!target || !handleRef.current) return;
    setError(null);
    setLoading(true);
    try {
      const updated = await devSwap(repo, handleRef.current, target, refresh);
      setSwaps(updated);
      if (!url) setInput("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [input, repo]);

  const handleUnswap = useCallback(
    async (devUrl: AutomergeUrl) => {
      if (!handleRef.current) return;
      setError(null);
      try {
        setSwaps(await devUnswap(handleRef.current, devUrl));
      } catch (e: any) {
        setError(e.message);
      }
    },
    []
  );

  const handleRemove = useCallback(
    async (devUrl: AutomergeUrl) => {
      if (!handleRef.current) return;
      setError(null);
      try {
        setSwaps(await devRemove(handleRef.current, devUrl));
        setConfirmingRemove(null);
      } catch (e: any) {
        setError(e.message);
      }
    },
    []
  );

  if (!ready) {
    return <div style={{ padding: "12px", fontSize: "13px" }}>Loading...</div>;
  }

  const entries = Object.values(swaps).sort((a, b) => {
    const aId = a.entries[0]?.originalToolId ?? a.devUrl;
    const bId = b.entries[0]?.originalToolId ?? b.devUrl;
    return aId.localeCompare(bId);
  });

  return (
    <div style={{ padding: "12px", fontFamily: "system-ui", fontSize: "13px" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Dev Swap</h3>

      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        <input
          type="text"
          placeholder="automerge:..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSwap()}
          style={{
            flex: 1,
            padding: "4px 8px",
            border: "1px solid #666",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            background: "#333",
            color: "#fff",
          }}
        />
        <button
          onClick={() => handleSwap()}
          disabled={loading || !input.trim()}
          style={{
            ...btnStyle,
            padding: "4px 10px",
            fontSize: "12px",
            opacity: loading || !input.trim() ? 0.5 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "..." : "Swap"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#f66",
            fontSize: "12px",
            marginBottom: "8px",
            wordBreak: "break-all",
          }}
        >
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ color: "#888", fontSize: "12px" }}>
          No active dev swaps.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {entries.map((record) => (
            <div
              key={record.devUrl}
              style={{
                padding: "6px 8px",
                background: "#2a2a2a",
                borderRadius: "4px",
                fontSize: "12px",
                border: record.swapped ? "1px solid #4a4" : "1px solid #444",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#999",
                    wordBreak: "break-all",
                    flex: 1,
                  }}
                >
                  {record.devUrl}
                </div>
                {confirmingRemove === record.devUrl ? (
                  <div style={{ display: "flex", gap: "4px", marginLeft: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => handleRemove(record.devUrl)}
                      style={{ ...btnStyle, background: "#a33" }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmingRemove(null)}
                      style={btnStyle}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingRemove(record.devUrl)}
                    style={{
                      ...btnStyle,
                      background: "transparent",
                      color: "#888",
                      padding: "0 4px",
                      fontSize: "14px",
                      lineHeight: "1",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
              {record.entries.map((entry) => (
                <div key={entry.originalToolId} style={{ marginBottom: "2px" }}>
                  <span style={{ color: "#aaa" }}>{entry.originalToolId}</span>
                  {" → "}
                  <span style={{ fontWeight: 500, color: "#ddd" }}>{entry.devToolId}</span>
                  <span style={{ color: "#888", marginLeft: "4px" }}>
                    ({entry.field})
                  </span>
                </div>
              ))}
              <div style={{ marginTop: "4px" }}>
                {record.swapped ? (
                  <button
                    onClick={() => handleUnswap(record.devUrl)}
                    style={btnStyle}
                  >
                    Unswap
                  </button>
                ) : (
                  <button
                    onClick={() => handleSwap(record.devUrl)}
                    style={{ ...btnStyle, background: "#4a4" }}
                  >
                    Swap
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
