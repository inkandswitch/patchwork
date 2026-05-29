/**
 * Render a template string over named sources.
 *
 *     const t = template("Hello ${name}, you are ${age} years old");
 *     const detach = t(edge);   // edge.source.name, edge.source.age supply values
 *
 * Placeholders are `${name}` and match keys on `edge.source`. Missing or
 * non-stringable values render as the empty string. The "named sources buy
 * you readability" demonstration.
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

const PLACEHOLDER = /\$\{(\w+)\}/g;

export function template(
  tpl: string
): (edge: EdgeHandle<string>) => () => void {
  return (edge) =>
    edge.onAnyChange(() => {
      const rendered = tpl.replace(PLACEHOLDER, (_, name) => {
        const v = edge.source[name]?.value();
        return v == null ? "" : String(v);
      });
      edge.change(rendered);
    });
}
