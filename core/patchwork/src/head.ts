import externals from "@inkandswitch/patchwork-bootloader/externals";

const importmap: { imports: Record<string, string> } = { imports: {} };

for (const name of externals) {
  importmap.imports[name] = `/packages/${name}.js`;
}

const script = document.createElement("script");
script.type = "importmap";
script.textContent = JSON.stringify(importmap);
document.currentScript
  ? document.currentScript.after(script)
  : document.head.appendChild(script);
