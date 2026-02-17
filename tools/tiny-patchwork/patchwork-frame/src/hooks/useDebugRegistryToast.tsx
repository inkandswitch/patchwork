import { createEffect, createSignal, onCleanup } from "solid-js";
import {
  getAllRegistries,
  PluginRegistry,
} from "@inkandswitch/patchwork-plugins";

// NOTE: THIS IS GARBAGE CODE AND WILL BE REMOVED
// Written by Claude
// I hope its awfullness will be a good motivator
// to make plugins more legible and move us
// towards real version control and real UX
// so that doing everything via pushwork
// is not a rough experience.

type EventType = "registered" | "loaded" | "removed" | "changed";

interface RegistryEvent {
  id: string;
  type: string;
  event: EventType;
  pluginId?: string;
  pluginName?: string;
  timestamp: number;
}

interface UseDebugRegistryToastOptions {
  /** Which events to subscribe to. Defaults to ["changed"] for HMR updates. */
  events?: EventType[];
}

const DEBUG_MODAL_KEY = "debugModal";

export function isDebugModalEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_MODAL_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDebugModalEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEBUG_MODAL_KEY, "true");
    } else {
      localStorage.removeItem(DEBUG_MODAL_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

const DEFAULT_EVENTS: EventType[] = ["changed"];

export function useDebugRegistryToast(
  options: UseDebugRegistryToastOptions = {}
) {
  const { events: subscribedEvents = DEFAULT_EVENTS } = options;

  const [events, setEvents] = createSignal<RegistryEvent[]>([]);
  const [isEnabled, setIsEnabled] = createSignal(isDebugModalEnabled());

  // Track timeouts for cleanup
  const timeouts = new Set<number>();

  const addEvent = (
    type: string,
    event: RegistryEvent["event"],
    pluginId?: string,
    pluginName?: string
  ) => {
    const newEvent: RegistryEvent = {
      id: crypto.randomUUID(),
      type,
      event,
      pluginId,
      pluginName,
      timestamp: Date.now(),
    };

    setEvents((prev) => {
      const updated = [newEvent, ...prev].slice(0, 50); // Keep last 50 events
      return updated;
    });

    // Auto-remove after 5 seconds
    const timeoutId = setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
      timeouts.delete(timeoutId);
    }, 5000) as unknown as number;

    timeouts.add(timeoutId);
  };

  const dismissEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const clearAll = () => {
    setEvents([]);
  };

  createEffect(() => {
    if (!isEnabled()) {
      setEvents([]);
      // Clear any pending timeouts
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
      return;
    }

    const registries = getAllRegistries();
    const unsubscribes: (() => void)[] = [];

    // Track last plugin info per registry type for "changed" events
    const lastPluginInfo = new Map<
      string,
      { id: string; name?: string; action: string }
    >();

    registries.forEach((registry: PluginRegistry<any>, type: string) => {
      // Always track plugin info for "changed" events to show context
      const trackRegistered = registry.on("registered", (plugin) => {
        lastPluginInfo.set(type, {
          id: plugin.id,
          name: plugin.name,
          action: "registered",
        });
        if (subscribedEvents.includes("registered")) {
          addEvent(type, "registered", plugin.id, plugin.name);
        }
      });
      unsubscribes.push(trackRegistered);

      const trackLoaded = registry.on("loaded", (plugin) => {
        lastPluginInfo.set(type, {
          id: plugin.id,
          name: plugin.name,
          action: "loaded",
        });
        if (subscribedEvents.includes("loaded")) {
          addEvent(type, "loaded", plugin.id, plugin.name);
        }
      });
      unsubscribes.push(trackLoaded);

      const trackRemoved = registry.on("removed", (id) => {
        lastPluginInfo.set(type, { id, action: "removed" });
        if (subscribedEvents.includes("removed")) {
          addEvent(type, "removed", id);
        }
      });
      unsubscribes.push(trackRemoved);

      if (subscribedEvents.includes("changed")) {
        const unsub = registry.on("changed", () => {
          const info = lastPluginInfo.get(type);
          addEvent(type, "changed", info?.id, info?.name);
          // Clear after showing
          lastPluginInfo.delete(type);
        });
        unsubscribes.push(unsub);
      }
    });

    onCleanup(() => {
      unsubscribes.forEach((unsub) => unsub());
      // Clear all pending timeouts
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    });
  });

  // Listen for storage changes (for cross-tab sync)
  createEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DEBUG_MODAL_KEY) {
        setIsEnabled(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    onCleanup(() => window.removeEventListener("storage", handleStorageChange));
  });

  return {
    events,
    isEnabled,
    setIsEnabled: (enabled: boolean) => {
      setDebugModalEnabled(enabled);
      setIsEnabled(enabled);
    },
    dismissEvent,
    clearAll,
  };
}

// Toast UI Component
export function DebugRegistryToast({
  events,
  onDismiss,
  onClearAll,
}: {
  events: RegistryEvent[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) {
  if (events.length === 0) return null;

  const eventColor = (event: RegistryEvent["event"]) => {
    switch (event) {
      case "registered":
        return "var(--debug-toast-registered, #3b82f6)";
      case "loaded":
        return "var(--debug-toast-loaded, #22c55e)";
      case "removed":
        return "var(--debug-toast-removed, #ef4444)";
      case "changed":
        return "var(--debug-toast-changed, #f59e0b)";
    }
  };

  return (
    <div class="debug-registry-toast">
      <div class="debug-registry-toast__header">
        <span class="debug-registry-toast__title">
          🔧 Registry ({events.length})
        </span>
        <button
          class="debug-registry-toast__clear"
          onClick={onClearAll}
          title="Clear all"
        >
          ✕
        </button>
      </div>
      <div class="debug-registry-toast__list">
        {events.map((event) => (
          <div
            class="debug-registry-toast__item"
            style={{ "border-left-color": eventColor(event.event) }}
            onClick={() => onDismiss(event.id)}
          >
            <div class="debug-registry-toast__content">
              <span class="debug-registry-toast__event-type">
                {event.event}
              </span>
              <span class="debug-registry-toast__plugin-type">
                {event.type}
              </span>
              {event.pluginId && (
                <span class="debug-registry-toast__plugin-id">
                  {event.pluginId}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
