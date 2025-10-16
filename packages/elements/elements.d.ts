declare module "react" {
  export namespace JSX {
    export interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          docUrl: string;
          toolId: string;
        },
        HTMLElement
      >;
    }
  }
}
