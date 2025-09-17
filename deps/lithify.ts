#!/usr/bin/env -S deno run --allow-all
import { DOMParser } from "dom";

const SDK_URL = "automerge:1PQPjuHQYtFoeVvhEfq3n59Cf46";
const DEPS_URL = "automerge:4NLSxeMB2scthNxKRJYjrBPqrQih";

const html = await (await fetch("https://patchwork.inkandswitch.com")).text();
const dom = new DOMParser().parseFromString(html, "text/html");
const mapElement = dom.querySelector("script[type=importmap]");
if (!mapElement) throw new Error("No import map found");
const map = JSON.parse(mapElement.textContent || "{}");
const munged: Record<string, string> = Object.assign(
  map.scopes["https://ga.jspm.io/"],
  map.imports
);
const entries = Object.entries(munged);
const out: Record<string, string> = {};
const maponly = Deno.args.includes("map");
for (const [dependency, href] of entries) {
  if (dependency.startsWith("@patchwork/sdk")) {
    out[dependency] = href.replace("../sdk/", `/automerge/${SDK_URL}`);
    continue;
  }
  const parts = dependency.split("/");
  if (parts.length > 1) {
    await Deno.mkdir(["./lith"].concat(parts).slice(0, -1).join("/"), {
      recursive: true,
    });
  }

  const path = `${dependency}.js`;
  const aref = `/automerge/${DEPS_URL}/${path}`;
  out[dependency] = aref;
  if (!maponly) {
    console.error(`[${dependency}] ${href} -> ./lith/${path}`);
    try {
      await Deno.writeFile(
        "./lith/" + path,
        await fetch(href).then((r) => r.bytes())
      );
    } catch (error) {
      console.error(`!!! Error fetching ${href}: ${error}`);
    }
  }
}

console.log(JSON.stringify(out, null, 2));
