declare namespace JSX {
  interface IntrinsicElements {
    "patchwork-embed": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "doc-url"?: string;
      },
      HTMLElement
    >;
  }
}
