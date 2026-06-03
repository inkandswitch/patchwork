/**
 * Aggregate entry for the edge-handles demo bundle.
 *
 * Ships:
 *
 * - `patchwork:tool` `edge-pair`     — two-pane preview wired by an EdgeHandle.
 * - `patchwork:tool` `wired-space`   — spatial canvas where you draw arrows
 *                                     between docs to wire them.
 *
 * Transforms aren't registered as plugins — they live as small attach
 * functions in `./patterns/` and are pulled in by each tool. Cross-tool
 * transform sharing is a job for the future workflow layer.
 */

import type { Plugin } from "@inkandswitch/patchwork-plugins";

import { edgePairPlugins } from "./edge-pair-tool.js";
import { wiredSpacePlugins } from "./wired-space-tool.js";

export const plugins: Plugin<any>[] = [
  ...edgePairPlugins,
  ...wiredSpacePlugins,
];
