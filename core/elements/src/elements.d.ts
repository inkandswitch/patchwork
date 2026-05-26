import "react";
import "solid-js";

// ─── <patchwork-view> attribute shapes ──────────────────────────────────
//
// The new element accepts EITHER the new-style attributes (`url`/`component`)
// OR the legacy passthrough attributes (`doc-url`/`tool-id`)

type PatchworkViewNewAttrs = {
  url?: string | null;
  component?: string | null;
  "doc-url"?: never;
  "tool-id"?: never;
};

type PatchworkViewLegacyAttrs = {
  "doc-url"?: string | null;
  "tool-id"?: string | null;
  url?: never;
  component?: never;
};

type PatchworkViewAttrs = PatchworkViewNewAttrs | PatchworkViewLegacyAttrs;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { class?: string } & PatchworkViewAttrs;
      "patchwork-view-legacy": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "doc-url": string;
        "tool-id"?: string | null;
        class?: string;
      };
    }
  }
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": PatchworkViewAttrs;
      "patchwork-view-legacy": {
        "doc-url": string;
        "tool-id"?: string | null;
      };
    }
  }
}

// react also likes to pollute the global scope
declare namespace JSX {
  interface IntrinsicElements {
    "patchwork-view": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { class?: string } & PatchworkViewAttrs;
    "patchwork-view-legacy": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "doc-url": string;
      "tool-id"?: string | null;
      class?: string;
    };
  }
}
