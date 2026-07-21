#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import net from "node:net";
import path from "node:path";

const require = createRequire(import.meta.url);
const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// The compiled config, not the .ts source: playwright never transforms files
// under node_modules, and node can't strip types there either.
const configPath = path.join(packageDir, "dist", "playwright.config.js");

const USAGE = `patchwork-e2e — run the Patchwork browser + service-worker e2e suite

Usage:
  patchwork-e2e [options] [-- playwright args...]

Options:
  --live-site=<url>        also run the cross-profile sync test against a
                           deployed site (e.g. https://patchwork.inkandswitch.com).
                           omitted: that test is skipped.
  --base-url=<url>         test against a server that is already running;
                           no preview server is started.
  --port=<n>               port for the preview server (default: the first
                           free one from 5173 up).
  --preview-command=<cmd>  command that serves the built site
                           (default "pnpm preview").
  --site-dir=<path>        directory to run the preview command in
                           (default the current directory).
  --extra-tests-dir=<path> also run your own specs, as a "<browser>:extra"
                           project. Import helpers from
                           "@inkandswitch/patchwork-e2e/helpers".
  --help                   show this.

Anything after -- (or any unrecognised flag) is passed to \`playwright test\`,
so --headed, --ui, --project=chromium and test filters all work.

Examples:
  patchwork-e2e --live-site=https://patchwork.inkandswitch.com
  patchwork-e2e --base-url=http://localhost:4173 --project=chromium
  patchwork-e2e -- --headed cross-profile
`;

const options = {};
const passthrough = [];

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--") {
    passthrough.push(...process.argv.slice(i + 1));
    break;
  }
  if (arg === "--help" || arg === "-h") {
    process.stdout.write(USAGE);
    process.exit(0);
  }
  const match =
    /^--(live-site|base-url|port|preview-command|site-dir|extra-tests-dir)(?:=(.*))?$/.exec(arg);
  if (!match) {
    passthrough.push(arg);
    continue;
  }
  const [, name, inline] = match;
  const value = inline ?? process.argv[++i];
  if (value === undefined) {
    process.stderr.write(`patchwork-e2e: --${name} needs a value\n`);
    process.exit(1);
  }
  options[name] = value;
}

const siteDir = path.resolve(options["site-dir"] ?? process.cwd());

// `vite preview` quietly moves to the next free port when the one it was
// given is taken, and playwright then waits out its whole timeout on a port
// nobody is serving. So pick a port we know is free before starting.
// Probe by connecting rather than by binding: SO_REUSEADDR lets a wildcard
// bind succeed while something else already holds the port on ::1 alone.
function portIsFree(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "localhost" });
    const done = (free) => {
      socket.destroy();
      resolve(free);
    };
    socket.setTimeout(500);
    socket.once("connect", () => done(false));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(true));
  });
}

async function choosePort() {
  if (options.port) {
    if (await portIsFree(Number(options.port))) return options.port;
    process.stderr.write(`patchwork-e2e: port ${options.port} is already in use\n`);
    process.exit(1);
  }
  for (let port = 5173; port < 5273; port++) {
    if (await portIsFree(port)) return String(port);
  }
  process.stderr.write("patchwork-e2e: no free port between 5173 and 5272\n");
  process.exit(1);
}

const env = {
  ...process.env,
  PATCHWORK_E2E_SITE_DIR: siteDir,
  PATCHWORK_E2E_OUTPUT_DIR: process.cwd(),
};
if (options["live-site"]) env.PATCHWORK_E2E_LIVE_SITE = options["live-site"];
if (options["base-url"]) env.PATCHWORK_E2E_BASE_URL = options["base-url"];
else env.PORT = await choosePort();
if (options["preview-command"]) {
  env.PATCHWORK_E2E_PREVIEW_COMMAND = options["preview-command"];
}
if (options["extra-tests-dir"]) {
  env.PATCHWORK_E2E_EXTRA_TESTS_DIR = path.resolve(options["extra-tests-dir"]);
}

const child = spawn(
  process.execPath,
  [require.resolve("@playwright/test/cli"), "test", "--config", configPath, ...passthrough],
  { stdio: "inherit", env, cwd: siteDir },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
