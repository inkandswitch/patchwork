import type React from "react";

declare namespace JSX {
  interface IntrinsicElements {
    "patchwork-view": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        docUrl: string;
        toolId: string;
      },
      HTMLElement
    >;
  }
}
