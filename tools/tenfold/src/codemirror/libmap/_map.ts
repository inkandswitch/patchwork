const declarations = import.meta.glob("./*.d.ts", {
  eager: true,
  query: "raw",
});
export default new Map(
  Object.entries(declarations).map(([key, value]) => [
    key.slice(1),
    (value as { default: string }).default,
  ])
);
