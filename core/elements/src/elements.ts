import type {} from "react";
import type {} from "solid-js";

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
      "patchwork-component": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        url?: string;
        component?: string;
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
      "patchwork-component": {
        url?: string;
        component?: string;
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
    "patchwork-component": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      url?: string;
      component?: string;
      class?: string;
    };
  }
}
