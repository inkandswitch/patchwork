export * from "./patchwork-view.js";
export * from "./patchwork-view-legacy.js";
export * from "./events.js";

import type {} from "react";
import type {} from "solid-js";

/**
 * Attributes for the legacy mode of `<patchwork-view>`: the wrapper
 * delegates to an inner `<patchwork-view-legacy>` driven by `doc-url`
 * and `tool-id`. The component-mode attributes are typed as `never` so
 * that mixing the two modes in JSX is a compile-time error.
 */
type PatchworkViewLegacyAttrs = {
  "doc-url"?: string;
  "tool-id"?: string | null;
  component?: never;
  url?: never;
};

/**
 * Attributes for the component mode of `<patchwork-view>`: the wrapper
 * mounts a registered `patchwork:component` plugin in place. The
 * legacy-mode attributes are typed as `never` for the same reason as
 * above.
 */
type PatchworkViewComponentAttrs = {
  "doc-url"?: never;
  "tool-id"?: never;
  component?: string;
  url?: string;
};

/**
 * Discriminated union of the two valid attribute sets for
 * `<patchwork-view>`. Setting attributes from both halves on the same
 * element is a type error.
 */
type PatchworkViewAttrs =
  | PatchworkViewLegacyAttrs
  | PatchworkViewComponentAttrs;

type PatchworkViewLegacyElementAttrs = {
  "doc-url": string;
  "tool-id"?: string | null;
};

declare module "react" {
  export namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewAttrs;
      "patchwork-view-legacy": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewLegacyElementAttrs;
    }
  }
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": PatchworkViewAttrs;
      "patchwork-view-legacy": PatchworkViewLegacyElementAttrs;
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
      "patchwork-view-legacy": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewLegacyElementAttrs;
    }
  }
}
