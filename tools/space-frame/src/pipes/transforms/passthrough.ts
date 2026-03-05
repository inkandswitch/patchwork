import { registerTransform } from "./registry";

registerTransform({
  type: "passthrough",
  name: "Passthrough",
  description: "Passes data through unchanged",
  run(doc: any): any {
    if (typeof doc === "string") return doc;
    if (doc?.content && typeof doc.content === "string") return doc.content;
    return JSON.stringify(doc, null, 2);
  },
});
