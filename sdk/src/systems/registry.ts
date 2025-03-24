import EventEmitter from "eventemitter3";
import { IconType } from "../ui";

/**
 * Base interface for all system element descriptions
 */
export interface SystemElementDescription {
  id: string;
  type: string;
  name: string;
  icon?: IconType;
  importUrl?: string;
}

/**
 * Generic loadable system element
 * D = Description type that extends SystemElementDescription
 * I = Implementation type that will be loaded
 */
export type LoadableSystemElement<
  D extends SystemElementDescription = SystemElementDescription,
  I = any
> = D & {
  load: () => Promise<I>;
};

/**
 * A fully loaded system element combining description and implementation
 * D = Description type, I = Implementation type
 */
export type SystemElement<
  D extends SystemElementDescription = SystemElementDescription,
  I = any
> = D & I;

/**
 * Registry for managing elements of a specific system type
 */
export class SystemRegistry<T extends SystemElementDescription> {
  private elements = new Map<string, T>();
  private loadPromises = new Map<string, Promise<T>>();
  private events = new EventEmitter<{
    "elements:changed": (elements: Record<string, T>) => void;
  }>();

  /**
   * Register an element with this registry
   */
  async register(element: T, importUrl?: string): Promise<void> {
    // If an import URL was provided, attach it to the element
    if (importUrl && !element.importUrl) {
      element.importUrl = importUrl;
    }

    // Store the element, regardless of whether it's immediate or deferred
    this.elements.set(element.id, element);

    // Notify listeners
    this.events.emit("elements:changed", this.getAll());
  }

  /**
   * Get an element by ID without loading it (synchronous)
   * Returns the element as-is, whether loaded or not
   */
  getById(id: string): T | undefined {
    return this.elements.get(id);
  }

  /**
   * Load an element by ID, loading it on demand if necessary (asynchronous)
   * If shouldWait is true, will wait for the element to be registered if it isn't already
   */
  async loadById(
    id: string,
    shouldWait = false,
    timeout = 10000
  ): Promise<T | undefined> {
    // Check if we're already loading this element
    if (this.loadPromises.has(id)) {
      return this.loadPromises.get(id);
    }

    // Get the element
    const element = this.getById(id);
    if (!element) {
      // If the element isn't registered and we shouldn't wait, return undefined
      if (!shouldWait) {
        return undefined;
      }

      // If shouldWait is true, set up a promise that will listen for element registration events
      return new Promise<T | undefined>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.events.off("elements:changed", checkForElement);
          reject(new Error(`Timeout waiting for element ${id}`));
        }, timeout);

        const checkForElement = async () => {
          if (this.elements.has(id)) {
            clearTimeout(timeoutId);
            this.events.off("elements:changed", checkForElement);
            const element = await this.loadById(id);
            resolve(element);
          }
        };

        // Listen for element registration events
        this.events.on("elements:changed", checkForElement);

        // Check once immediately in case it was registered between our initial check and setting up the listener
        checkForElement();
      });
    }

    // If the element is loadable, load it
    if (isLoadableElement(element)) {
      const loadPromise = (element as LoadableSystemElement<T>)
        .load()
        .then((implementation) => {
          // Merge the implementation with the element metadata to create a complete SystemElement
          // Omit the load method as it's no longer needed
          const { load, ...elementWithoutLoad } = element;
          const loadedElement = {
            ...elementWithoutLoad,
            ...implementation,
          } as T;

          // Replace the original element with the loaded version
          this.elements.set(element.id, loadedElement);
          this.loadPromises.delete(id);

          // Notify listeners that an element has been loaded
          this.events.emit("elements:changed", this.getAll());

          return loadedElement;
        });

      // Store the promise so we don't load twice
      this.loadPromises.set(id, loadPromise);
      return loadPromise;
    }

    // Element doesn't need loading, return as is
    return element;
  }

  /**
   * Get all elements, both immediate and deferred
   */
  getAll(): Record<string, T> {
    return Object.fromEntries(this.elements.entries());
  }

  /**
   * Get all registered elements as an array
   */
  getAllElements(): T[] {
    return Array.from(this.elements.values());
  }

  /**
   * Get an element by ID
   */
  getElementById(id: string): T | undefined {
    return this.getById(id);
  }

  /**
   * Check if an element ID is registered
   */
  hasElement(id: string): boolean {
    return this.elements.has(id);
  }

  /**
   * Subscribe to element changes
   */
  onChange(callback: (elements: Record<string, T>) => void): () => void {
    if (!callback || typeof callback !== "function") {
      console.warn("Invalid callback provided to SystemRegistry.onChange");
      return () => {}; // Return a no-op function
    }

    try {
      this.events.on("elements:changed", callback);

      // Create a simple cleanup function with no additional properties
      const cleanupFn = () => {
        console.log("cleanupFn");
        try {
          // Check if the events object still exists before trying to remove the listener
          if (this.events && typeof this.events.off === "function") {
            this.events.off("elements:changed", callback);
          }
        } catch (error) {
          console.error("Error removing onChange listener:", error);
        }
      };

      // Return a pure function with no properties
      return cleanupFn;
    } catch (error) {
      console.error("Error registering onChange listener:", error);
      return () => {}; // Return a no-op function
    }
  }

  /**
   * Check if a value is an element of the expected type
   */
  isElement(value: unknown): value is T {
    return (
      value !== null &&
      typeof value === "object" &&
      "type" in value &&
      typeof (value as T).type === "string" &&
      "id" in value &&
      typeof (value as T).id === "string"
    );
  }
}

/**
 * Type guard to check if a value is a system element
 */
export function isSystemElement(
  value: unknown
): value is SystemElementDescription {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as SystemElementDescription).type === "string" &&
    "id" in value &&
    typeof (value as SystemElementDescription).id === "string"
  );
}

/**
 * Type guard to check if a system element has a loader
 */
export function isLoadableElement<
  D extends SystemElementDescription = SystemElementDescription,
  I = any
>(value: unknown): value is LoadableSystemElement<D, I> {
  return (
    isSystemElement(value) &&
    "load" in value &&
    typeof (value as LoadableSystemElement<D, I>).load === "function"
  );
}

/**
 * Helper function to create a system element
 * This helps ensure type safety when creating complete system elements
 */
export function createElement<D extends SystemElementDescription, I>(
  description: D,
  implementation: I
): SystemElement<D, I> {
  return {
    ...description,
    ...implementation,
  } as SystemElement<D, I>;
}
