import type { Plugin } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { PatchworkVitePluginOptions } from "./patchwork-plugin.js";
import { DEFAULT_SYNC_SERVERS, PRELOAD_WASM_ASSETS, escapeHtml } from "./shared.js";
import { ICON_SPECS } from "./icons.js";

const GENERATED_PATH = "index.html";

function buildHtml(options: PatchworkVitePluginOptions): string {
  const title = options.title ?? options.siteName ?? "Patchwork";
  const lang = (options.html && options.html.lang) || "en";
  const entry = options.entry ?? "/src/main.ts";
  const syncServers = options.syncServers ?? DEFAULT_SYNC_SERVERS;

  const head: string[] = [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<title>${escapeHtml(title)}</title>`,
  ];

  if (options.description) {
    head.push(
      `<meta name="description" content="${escapeHtml(options.description)}" />`
    );
  }

  if (options.icons) {
    for (const spec of ICON_SPECS) {
      if (spec.fileName === "apple-touch-icon.png") {
        head.push(
          `<link rel="apple-touch-icon" sizes="${spec.size}x${spec.size}" href="/${spec.fileName}" />`
        );
      } else if (spec.fileName.startsWith("favicon-")) {
        head.push(
          `<link rel="icon" type="image/png" sizes="${spec.size}x${spec.size}" href="/${spec.fileName}" />`
        );
      }
    }
    if (options.icons?.maskIcon) {
      head.push(
        `<link rel="mask-icon" href="${options.icons.maskIcon}" color="${
          options.icons.maskIconColor ?? "#000000"
        }" />`
      );
    }
  }

  if (options.themeColor) {
    head.push(
      `<meta name="theme-color" content="${options.themeColor.light}" media="(prefers-color-scheme: light)" />`,
      `<meta name="theme-color" content="${options.themeColor.dark}" media="(prefers-color-scheme: dark)" />`
    );
  }

  head.push(
    `<meta name="apple-mobile-web-app-capable" content="yes" />`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`,
    `<meta name="apple-mobile-web-app-title" content="${escapeHtml(title)}" />`
  );

  if (options.manifest !== false) {
    head.push(`<link rel="manifest" href="/manifest.webmanifest" />`);
  }

  for (const server of syncServers) {
    head.push(`<link rel="preconnect" href="${server}" />`);
  }
  for (const server of syncServers) {
    head.push(`<link rel="dns-prefetch" href="${server}" />`);
  }
  for (const asset of PRELOAD_WASM_ASSETS) {
    head.push(
      `<link rel="preload" href="/${asset}" as="fetch" crossorigin />`
    );
  }

  if (options.html && options.html.extraHead) {
    head.push(options.html.extraHead);
  }

  return `<!doctype html>
<html lang="${lang}">
${head.join("\n")}
<patchwork-view id="root"></patchwork-view>
<script type="module" src="${entry}"></script>
</html>
`;
}

/**
 * Vite's own html-asset pipeline reads the entry html straight off disk (not
 * through the plugin's virtual module graph) and mirrors the input's
 * location relative to root into the build output, so a fully generated
 * index.html has to be written to the project root as a real index.html —
 * gitignore it in sites using `html !== false`.
 */
export function htmlPlugin(
  options: PatchworkVitePluginOptions = {}
): Plugin | null {
  if (options.html === false) return null;

  const html = buildHtml(options);
  let generatedPath: string;

  return {
    name: "@patchwork/html",
    enforce: "pre",
    async config(config) {
      const root = resolve(config.root ?? process.cwd());
      generatedPath = resolve(root, GENERATED_PATH);
      await mkdir(dirname(generatedPath), { recursive: true });
      await writeFile(generatedPath, html, "utf-8");
      return {
        build: { rollupOptions: { input: generatedPath } },
      };
    },
    configureServer: {
      order: "pre",
      handler(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== "/" && req.url !== "/index.html") {
            next();
            return;
          }
          const transformed = await server.transformIndexHtml(
            req.url,
            html,
            req.originalUrl
          );
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.end(transformed);
        });
      },
    },
  };
}
