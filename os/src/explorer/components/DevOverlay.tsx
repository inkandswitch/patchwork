import React, { useState, useEffect } from "react";

export const getRelativeTime = (timestampMs: number): string => {
  const nowUtc = Date.now();
  const diffMs = nowUtc - timestampMs;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return diffSeconds <= 1 ? "built just now" : `built ${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "built 1 minute ago" : `built ${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "built 1 hour ago" : `built ${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "built yesterday";
  } else {
    return `built ${diffDays} days ago`;
  }
};

interface DevOverlayProps {
  visible: boolean;
}

export const DevOverlay: React.FC<DevOverlayProps> = ({ visible }) => {
  const [debugEnabled, setDebugEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Query initial debug status
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "GET_DEBUG_STATUS" });
    }

    // Listen for debug status messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "DEBUG_STATUS") {
        setDebugEnabled(event.data.enabled);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleMessage);
  }, [visible]);

  const toggleDebug = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "DEBUG" });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 right-0 bg-black bg-opacity-50 text-white px-3 py-2 text-xs font-mono">
      <div>Version {__PATCHWORK_VERSION__.gitHash.slice(0, 7)}, {getRelativeTime(__PATCHWORK_VERSION__.buildTimestamp)}</div>
      <div className="mt-1">
        SW Debug Logs: {debugEnabled === null ? "..." : debugEnabled ? "ON" : "OFF"}{" "}
        <span
          className="underline cursor-pointer"
          onClick={toggleDebug}
        >
          toggle
        </span>
      </div>
    </div>
  );
};