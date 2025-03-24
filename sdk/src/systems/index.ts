// Import the registry system
import {
  SystemRegistry,
  SystemElement,
  SystemElementDescription,
} from "./registry";

// Re-export the registry module
export * from "./registry";

/**
 * Structure for system elements exported from a module
 */
export interface SystemsExport {
  [key: string]: SystemElement<any, any>[] | undefined;
}

// Map of system types to their registries
const systemTypeRegistries: Record<string, SystemRegistry<any>> = {};

/**
 * Get a registry for a specific system type, creating it if it doesn't exist
 * This implicitly registers the system type if it hasn't been registered yet
 */
export function getSystemRegistry<T extends SystemElementDescription>(
  systemType: string
): SystemRegistry<T> {
  // If the registry doesn't exist yet, create it
  if (!systemTypeRegistries[systemType]) {
    systemTypeRegistries[systemType] = new SystemRegistry<T>();
  }

  return systemTypeRegistries[systemType] as SystemRegistry<T>;
}

/**
 * Register elements for a specific system type
 */
async function registerElementsForSystemType(
  systemType: string,
  elements: SystemElement<any, any>[],
  sourceModule: string
): Promise<void> {
  const registry = getSystemRegistry(systemType);

  // Register each element with the registry
  for (const element of elements) {
    await registry.register(element, sourceModule);
  }
}

/**
 * Register all system elements from an export
 */
export async function registerSystemsExport(
  systems: SystemsExport,
  sourceModule: string
): Promise<void> {
  // Process each type of system
  for (const [systemType, elementList] of Object.entries(systems)) {
    if (!elementList || !Array.isArray(elementList)) continue;

    await registerElementsForSystemType(systemType, elementList, sourceModule);
  }
}

/**
 * Get a system element by type and ID without loading it
 */
export function getElementFromSystem<T extends SystemElement<any, any>>(
  systemType: string,
  id: string
): T | undefined {
  const registry = getSystemRegistry(systemType);
  return registry.getById(id) as T | undefined;
}

/**
 * Load a system element by type and ID
 * If shouldWait is true, will wait for the element to be registered if it isn't already available
 */
export async function loadElementFromSystem<T extends SystemElement<any, any>>(
  systemType: string,
  id: string,
  shouldWait = false,
  timeout = 10000
): Promise<T | undefined> {
  const registry = getSystemRegistry(systemType);
  return registry.loadById(id, shouldWait, timeout) as Promise<T | undefined>;
}

/**
 * Get all elements of a specific system type that are already loaded
 */
export function getAllElementsFromSystem<T extends SystemElement<any, any>>(
  systemType: string
): Record<string, T> {
  const registry = getSystemRegistry(systemType);
  return registry.getAll() as Record<string, T>;
}

/**
 * Get all registered elements of a specific system type
 */
export function getAllElementsOfSystemType<T extends SystemElement<any, any>>(
  systemType: string
): T[] {
  const registry = getSystemRegistry<any>(systemType);
  return registry.getAllElements() as T[];
}

/**
 * Check if a system element exists by type and ID
 */
export function hasSystemElement(systemType: string, id: string): boolean {
  const registry = getSystemRegistry(systemType);
  return registry.hasElement(id);
}

/**
 * Subscribe to changes in a system registry
 */
export function onSystemElementsChange<T extends SystemElement<any, any>>(
  systemType: string,
  callback: (elements: Record<string, T>) => void
): () => void {
  const registry = getSystemRegistry(systemType);
  return registry.onChange(callback as any);
}
