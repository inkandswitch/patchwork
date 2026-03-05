export type TransformFn = (doc: any) => Promise<string | Blob> | string | Blob;

export type TransformDescriptor = {
  type: string;
  name: string;
  description?: string;
  run: TransformFn;
};

const transforms = new Map<string, TransformDescriptor>();

export function registerTransform(descriptor: TransformDescriptor) {
  transforms.set(descriptor.type, descriptor);
}

export function getTransform(type: string): TransformDescriptor | undefined {
  return transforms.get(type);
}

export function getAvailableTransforms(): TransformDescriptor[] {
  return Array.from(transforms.values());
}

export async function runTransformChain(
  types: string[],
  doc: any
): Promise<string | Blob | null> {
  let value: any = doc;

  for (const type of types) {
    const transform = transforms.get(type);
    if (!transform) {
      console.warn(`Transform "${type}" not found, skipping`);
      continue;
    }
    value = await transform.run(value);
  }

  return value;
}
