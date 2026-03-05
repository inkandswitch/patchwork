import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-space": {
        id?: string;
        col?: number;
        row?: number;
        cols?: number;
        rows?: number;
        collapsible?: string;
        collapsed?: string;
        "data-space-id"?: string;
        "data-editing"?: string;
        children?: any;
        class?: string;
        style?: string | Record<string, string>;
      };
      "patchwork-preview": {
        "data-space-id"?: string;
        style?: string;
        children?: any;
      };
    }
  }
}
