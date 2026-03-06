import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import { getRegistry } from "@inkandswitch/patchwork-plugins";

export const TRANSFORM_TYPE = "patchwork:transform";

export type TransformImplementation = {
  run(input: any, config?: Record<string, unknown>): Promise<any> | any;
  rendererTag?: string;
};

export interface TransformDescription extends PluginDescription {
  type: typeof TRANSFORM_TYPE;
  inputTypes?: string[];
}

export type Transform = LoadablePlugin<
  TransformDescription,
  TransformImplementation
>;

export type LoadedTransform = LoadedPlugin<
  TransformDescription,
  TransformImplementation
>;

export function getTransformRegistry() {
  return getRegistry<TransformDescription>(TRANSFORM_TYPE);
}

export function getAvailableTransforms() {
  return getTransformRegistry().all();
}

export async function loadTransform(id: string) {
  return getTransformRegistry().load(id);
}
