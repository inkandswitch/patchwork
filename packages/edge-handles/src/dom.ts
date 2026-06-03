/**
 * DOM <> handle bridge.
 *
 * Tools surface their automerge identity to the DOM via plain attributes so
 * any other tool (or the platform itself) can ask "what does this DOM node
 * represent in an automerge doc?" without coupling.
 *
 * We honour both the `<patchwork-view>` element's own `doc-url`/`tool-id`
 * attributes and explicit `data-*` attributes on arbitrary elements:
 *
 * | Attribute       | Handle kind   |
 * |-----------------|---------------|
 * | `doc-url`       | DocHandle     |
 * | `data-doc-url`  | DocHandle     |
 * | `data-ref-url`  | Ref           |
 * | `data-edge-url` | EdgeHandle    |
 *
 * Only the first matching attribute on a node is used. `closestHandle`
 * walks ancestors so transforms can attach anywhere inside an embedded view.
 *
 * Note: the upstream `refFromObject(handle, value)` landing in
 * `@automerge/automerge-repo` is a *different* primitive — it recovers a
 * `Ref` from a sub-object you already have in hand. The two compose: walk
 * the DOM here to get a URL, resolve it to a handle, then use
 * `refFromObject` upstream to address sub-objects within that handle.
 */

import type { HandleUrl } from "./edge-handle.js";

export interface HandleAttrs {
  docUrlAttr: "doc-url";
  dataDocUrlAttr: "data-doc-url";
  dataRefUrlAttr: "data-ref-url";
  dataEdgeUrlAttr: "data-edge-url";
}

export const HANDLE_ATTRS: HandleAttrs = {
  docUrlAttr: "doc-url",
  dataDocUrlAttr: "data-doc-url",
  dataRefUrlAttr: "data-ref-url",
  dataEdgeUrlAttr: "data-edge-url",
};

/** Read a handle URL directly off an element, without walking ancestors. */
export function handleFromElement(el: Element): HandleUrl | undefined {
  const direct =
    el.getAttribute(HANDLE_ATTRS.dataRefUrlAttr) ??
    el.getAttribute(HANDLE_ATTRS.dataEdgeUrlAttr) ??
    el.getAttribute(HANDLE_ATTRS.dataDocUrlAttr) ??
    el.getAttribute(HANDLE_ATTRS.docUrlAttr);
  return direct ? (direct as HandleUrl) : undefined;
}

/**
 * Walk up from `node` until we find an element carrying a handle URL.
 * Returns `undefined` if there isn't one in the ancestor chain.
 */
export function closestHandle(node: Node | null): HandleUrl | undefined {
  let el: Element | null =
    node instanceof Element
      ? node
      : ((node && (node.parentElement as Element | null)) ?? null);
  while (el) {
    const found = handleFromElement(el);
    if (found) return found;
    el = el.parentElement;
  }
  return undefined;
}

/**
 * Discover every handle-carrying element under `root`. Pass a custom
 * `selector` to scope the search; the default finds all four supported
 * attributes.
 */
export function querySelectorHandles(
  root: ParentNode = document,
  selector: string = `[${HANDLE_ATTRS.docUrlAttr}],[${HANDLE_ATTRS.dataDocUrlAttr}],[${HANDLE_ATTRS.dataRefUrlAttr}],[${HANDLE_ATTRS.dataEdgeUrlAttr}]`
): { element: Element; url: HandleUrl }[] {
  const out: { element: Element; url: HandleUrl }[] = [];
  const elements = Array.from(root.querySelectorAll(selector));
  for (const el of elements) {
    const url = handleFromElement(el);
    if (url) out.push({ element: el, url });
  }
  return out;
}
