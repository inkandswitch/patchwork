export * from "./patchwork-view.js";
export * from "./events.js";
export {
  registerPatchworkIsolationElement,
  type PatchworkIsolationElement,
  type IsolationBootSpec,
} from "./isolation/index.js";

import type {} from "react";
import type {} from "solid-js";

// Discriminated on `component`: absent → legacy mode, present →
// component mode. `url` is forbidden in legacy mode (meaningless
// without `component`); `doc-url` / `tool-id` are allowed in component
// mode as passthrough data for the inner component to read.
type LegacyPatchworkViewAttrs = {
  "doc-url"?: string;
  "tool-id"?: string | null;
  component?: never;
  url?: never;
};

type PatchworkViewComponentAttrs = {
  component: string;
  url?: string;
  "doc-url"?: string;
  "tool-id"?: string | null;
};

type PatchworkViewAttrs =
  | LegacyPatchworkViewAttrs
  | PatchworkViewComponentAttrs;

type PatchworkIsolationAttrs = {
  "doc-url"?: string;
  "tool-id"?: string | null;
};

declare module "react" {
  export namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        PatchworkViewAttrs;
      "patchwork-isolation": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        PatchworkIsolationAttrs;
    }
  }
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": HTMLAttributes<HTMLElement> & PatchworkViewAttrs;
      "patchwork-isolation": HTMLAttributes<HTMLElement> &
        PatchworkIsolationAttrs;
    }
  }
}

// React also pollutes the global JSX namespace; mirror it for setups
// that read intrinsics from `global.JSX`.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        PatchworkViewAttrs;
      "patchwork-isolation": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > &
        PatchworkIsolationAttrs;
    }
  }
}
