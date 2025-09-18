declare namespace JSX {
  interface IntrinsicElements {
    "rootstock-tool": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "doc-url": string;
        "tool-id": string;
      },
      HTMLElement
    >;
  }
}
