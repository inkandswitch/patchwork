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
        "tool-url"?: string | null;
        id?: string;
        class?: string;
      };
      "patchwork-tool-picker": React.DetailedHTMLProps<
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
      "patchwork-view": {
        "doc-url": string;
        "tool-id"?: string;
        "tool-url"?: string;
        id?: string;
        class?: string;
      };
      "patchwork-tool-picker": {
        "doc-url": string;
        "tool-id"?: string;
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
      "tool-url"?: string | null;
      id?: string;
      class?: string;
    };
    "patchwork-tool-picker": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "doc-url": string;
      "tool-id"?: string | null;
      class?: string;
    };
  }
}
