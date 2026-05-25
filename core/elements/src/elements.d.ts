import "react";
import "solid-js";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "doc-url": string;
        "tool-id"?: string | null;
        class?: string;
      };
      "patchwork-view-2": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "component-id"?: string | null;
        "doc-url"?: string | null;
        class?: string;
      };
    }
  }
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": {
        "doc-url": string;
        "tool-id": string;
      };
      "patchwork-view-2": {
        "component-id": string;
        "doc-url"?: string;
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
    > & {
      "doc-url": string;
      "tool-id"?: string | null;
      class?: string;
    };
    "patchwork-view-2": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "component-id"?: string | null;
      "doc-url"?: string | null;
      class?: string;
    };
  }
}
