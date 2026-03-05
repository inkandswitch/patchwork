export type TransformFn = (doc: any) => Promise<string | Blob> | string | Blob;

export type TransformDescriptor = {
  type: string;
  name: string;
  description?: string;
  url?: string;
  run: TransformFn;
};

const transforms = new Map<string, TransformDescriptor>();

export function registerTransform(descriptor: TransformDescriptor) {
  transforms.set(descriptor.type, descriptor);
  if (descriptor.url) {
    transforms.set(descriptor.url, descriptor);
  }
}

export function getTransform(typeOrUrl: string): TransformDescriptor | undefined {
  return transforms.get(typeOrUrl);
}

export function getAvailableTransforms(): TransformDescriptor[] {
  const seen = new Set<string>();
  const result: TransformDescriptor[] = [];
  for (const desc of transforms.values()) {
    if (!seen.has(desc.type)) {
      seen.add(desc.type);
      result.push(desc);
    }
  }
  return result;
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
