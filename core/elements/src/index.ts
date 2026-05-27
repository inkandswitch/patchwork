export * from "./patchwork-view.js";
export * from "./patchwork-component.js";
export * from "./events.js";

import type {} from "react";
import type {} from "solid-js";

type PatchworkViewAttrs = {
  "doc-url"?: string | null;
  "tool-id"?: string | null;
};

type PatchworkComponentAttrs = {
  url?: string | null;
  component?: string | null;
};

declare module "react" {
  export namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewAttrs;
      "patchwork-component": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkComponentAttrs;
    }
  }
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": PatchworkViewAttrs;
      "patchwork-component": PatchworkComponentAttrs;
    }
  }
}

// React also likes to pollute the global JSX namespace, so mirror these
// there too for setups that read intrinsics from `global.JSX`.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewAttrs;
      "patchwork-component": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkComponentAttrs;
    }
  }
}
