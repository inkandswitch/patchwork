import * as esbuild from "esbuild";

export type ContextOptions = {
  keyhiveEnabled: boolean;
  syncServerUrl: string;
  syncServerStorageId: string;
  outdir?: string;
  serviceWorkerPath?: string;
  serviceWorkerType?: WorkerType;
};

export function getBuildOptions({
  keyhiveEnabled,
  syncServerUrl: syncServer,
  syncServerStorageId: storageId,
  outdir,
  serviceWorkerPath,
  serviceWorkerType,
}: ContextOptions): esbuild.BuildOptions {
  serviceWorkerType ||= "classic";
  return {
    absWorkingDir: import.meta.dirname,
    outdir,
    define: {
      __CACHE_VERSION__: JSON.stringify(`cache-${new Date().toISOString()}`),
      __SYNC_SERVER_URL__: JSON.stringify(syncServer),
      __SYNC_SERVER_STORAGE_ID__: JSON.stringify(storageId),
      __SERVICE_WORKER_PATH__: JSON.stringify(
        serviceWorkerPath || "/service-worker.js"
      ),
      __SERVICE_WORKER_TYPE__: JSON.stringify(serviceWorkerType),
      __KEYHIVE_ENABLED__: `${keyhiveEnabled}`,
    },
  } satisfies esbuild.BuildOptions as esbuild.BuildOptions;
}

export default async function createContext(contextOptions: ContextOptions) {
  const sharedOptions = getBuildOptions(contextOptions);

  const sw = await esbuild.context({
    ...sharedOptions,
    entryPoints: ["../template/service-worker/service-worker.ts"],
    bundle: contextOptions.serviceWorkerType != "module",
    format: contextOptions.serviceWorkerType == "module" ? "esm" : "iife",
    sourcemap: false,
    minify: true,
  });

  const setup = await esbuild.context({
    ...sharedOptions,
    entryPoints: ["../template/client/setup.ts"],
    format: "esm",
    bundle: false,
  });

  return { sw, setup };
}

// @ts-expect-error it does
if (import.meta.main) {
  const { parseArgs } = await import("node:util");

  const {
    values: {
      keyhive,
      "sync-server": syncServer,
      "storage-id": storageId,
      outdir,
      watch,
    },
  } = parseArgs({
    args: process.argv.slice(2),
    options: {
      keyhive: {
        type: "boolean",
        default: false,
        short: "k",
      },
      "sync-server": {
        type: "string",
      },
      "storage-id": {
        type: "string",
      },
      outdir: {
        type: "string",
        default: process.cwd(),
        short: "o",
      },
      watch: {
        type: "boolean",
        default: false,
        short: "w",
      },
    },
  });

  if (!syncServer || !storageId) {
    throw new Error("--sync-server and --storage-id are required args");
  }

  const { sw, setup } = await createContext({
    keyhiveEnabled: keyhive,
    syncServerUrl: syncServer,
    syncServerStorageId: storageId,
    outdir,
    serviceWorkerPath: "service-worker.js",
  });

  if (watch) {
    await sw.watch();
    await setup.watch();
  } else {
    await sw.rebuild();
    await setup.rebuild();
    await sw.dispose();
    await setup.dispose();
  }
}
