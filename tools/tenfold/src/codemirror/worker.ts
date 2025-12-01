import * as Comlink from "comlink";
import {
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import ts from "typescript";
import { createWorker } from "@valtown/codemirror-ts/worker";
import fsMap from "./libmap/_map.ts";

const compilerOptions = {
  target: ts.ScriptTarget.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  allowImportingTsExtensions: true,
  lib: ["esnext", "tenfold"],
  module: ts.ModuleKind.ESNext,
  allowJs: true,
  checkJs: true,
  noEmit: true,
  composite: true,
  strict: false,
  noImplicitAny: false,
  isolatedModules: true,
} as ts.CompilerOptions;

const vfs = (async function () {
  const system = createSystem(fsMap);

  const vfs = createVirtualTypeScriptEnvironment(
    system,
    [],
    ts,
    compilerOptions
  );
  return vfs;
})();

const codemirrorTsWorker = createWorker({ env: vfs });

Comlink.expose(codemirrorTsWorker);
