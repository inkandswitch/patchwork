declare module "react" {
  export namespace JSX {
    export interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "doc-url": string;
          "tool-id": string;
        },
        HTMLElement
      >;
    }
  }
}

declare module "solid-js" {
  export namespace JSX {
    export interface IntrinsicElements {
      "patchwork-view": {
        "doc-url": string;
        "tool-id": string;
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
  }
}
