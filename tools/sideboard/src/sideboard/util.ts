import { onCleanup } from "solid-js";

export function useWindowEvent<E extends keyof WindowEventMap>(
  event: E,
  listener: (event: WindowEventMap[E]) => void
) {
  window.addEventListener(event, listener);
  onCleanup(() => window.removeEventListener(event, listener));
}

export function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const docUrl = params.get("doc");
  const toolId = params.get("tool");
  return { docUrl, toolId };
}
