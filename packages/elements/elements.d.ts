declare namespace JSX {
  interface IntrinsicElements {
    "patchwork-view": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        doc: string;
        tool: string;
      },
      HTMLElement
    >;
  }
}
