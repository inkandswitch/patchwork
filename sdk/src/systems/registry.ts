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
  importUrl?: string; // TODO: the module loader uses this; is this the right design?
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
 * D = Description type that extends SystemElementDescription
 * I = Implementation type that will be loaded and combined with the description
 */
export class SystemRegistry<D extends SystemElementDescription, I = any> {
  private elements = new Map<
    string,
    SystemElement<D, I> | LoadableSystemElement<D, I>
  >();
  private loadPromises = new Map<string, Promise<SystemElement<D, I>>>();
  private events = new EventEmitter<{
    "elements:changed": (
      elements: Record<string, D | SystemElement<D, I>>
    ) => void;
  }>();

  /**
   * Register an element with this registry
   */
  async register(
    element: D | LoadableSystemElement<D, I>,
    importUrl?: string
  ): Promise<void> {
    // If an import URL was provided, attach it to the element
    if (importUrl && !element.importUrl) {
      element.importUrl = importUrl;
    }

    // Convert D to LoadableSystemElement if needed
    const loadableElement = isLoadableElement(element)
      ? element
      : { ...element, load: async () => element as unknown as I };

    // Store the element
    this.elements.set(element.id, loadableElement);

    // Notify listeners
    this.events.emit("elements:changed", this.getAll());
  }

  /**
   * Get an element description by ID without loading it (synchronous)
   * Returns the description part of an element, whether loaded or not
   */
  getDescriptionById(id: string): D | undefined {
    const element = this.elements.get(id);
    if (!element) return undefined;

    // Extract just the description part by omitting any implementation-specific fields
    const { load, ...description } = element as any;
    return description as D;
  }

  /**
   * Get a loaded element by ID (synchronous)
   * Returns undefined if the element hasn't been loaded yet
   */
  getLoadedElementById(id: string): SystemElement<D, I> | undefined {
    const element = this.elements.get(id);
    if (!element) return undefined;
    if (isLoadableElement(element)) return undefined;
    return element;
  }

  /**
   * Get an element by ID, returning either its description or loaded state
   */
  getById(id: string): D | SystemElement<D, I> | undefined {
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
  ): Promise<SystemElement<D, I> | undefined> {
    // Check if we already have a loaded element
    const element = this.elements.get(id);
    if (element && !isLoadableElement(element)) {
      return element;
    }

    // Check if we're already loading this element
    if (this.loadPromises.has(id)) {
      return this.loadPromises.get(id);
    }

    // Get the element description
    const description = this.elements.get(id);
    if (!description) {
      // If the element isn't registered and we shouldn't wait, return undefined
      if (!shouldWait) {
        return undefined;
      }

      // If shouldWait is true, set up a promise that will listen for element registration events
      return new Promise<SystemElement<D, I> | undefined>((resolve, reject) => {
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
    if (isLoadableElement(description)) {
      const loadPromise = description.load().then((implementation) => {
        // Merge the implementation with the element metadata to create a complete SystemElement
        // Omit the load method as it's no longer needed
        const { load, ...descriptionWithoutLoad } = description;
        const loadedElement = createElement(
          descriptionWithoutLoad,
          implementation
        ) as SystemElement<D, I>;

        // Store the loaded version
        this.elements.set(description.id, loadedElement);
        this.loadPromises.delete(id);

        // Notify listeners that an element has been loaded
        this.events.emit("elements:changed", this.getAll());

        return loadedElement;
      });

      // Store the promise so we don't load twice
      this.loadPromises.set(id, loadPromise);
      return loadPromise;
    }

    // Element is already loaded
    return description as SystemElement<D, I>;
  }

  /**
   * Get all elements, both descriptions and loaded
   */
  getAll(): Record<string, D | SystemElement<D, I>> {
    return Object.fromEntries(this.elements.entries());
  }

  /**
   * Get all registered elements as an array
   */
  getAllElements(): (D | SystemElement<D, I>)[] {
    return Array.from(this.elements.values());
  }

  /**
   * Load all registered elements
   * @param filter Optional filter function to determine which elements to load
   * @param shouldWait Whether to wait for elements to be registered if they aren't already
   * @param timeout Timeout in milliseconds for waiting operations
   * @returns A promise resolving to a record of loaded elements
   */
  async loadAll(
    filter?: (element: D | SystemElement<D, I>) => boolean,
    shouldWait = false,
    timeout = 10000
  ): Promise<Record<string, SystemElement<D, I>>> {
    // Get all elements or filter them if a filter function is provided
    const elementsToLoad = filter
      ? Array.from(this.elements.entries()).filter(([_, element]) =>
          filter(element)
        )
      : Array.from(this.elements.entries());

    // Create an array of promises for loading each element
    const loadPromises = elementsToLoad.map(async ([id, _]) => {
      try {
        const loadedElement = await this.loadById(id, shouldWait, timeout);
        return [id, loadedElement];
      } catch (error) {
        console.warn(`Failed to load element ${id}:`, error);
        return [id, undefined];
      }
    });

    // Wait for all elements to load
    const results = await Promise.all(loadPromises);

    // Filter out any elements that failed to load and convert to a record
    return Object.fromEntries(
      results.filter(([_, element]) => element !== undefined) as [
        string,
        SystemElement<D, I>
      ][]
    );
  }

  /**
   * Get an element by ID
   */
  getElementById(id: string): D | SystemElement<D, I> | undefined {
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
  onChange(
    callback: (elements: Record<string, D | SystemElement<D, I>>) => void
  ): () => void {
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
  isElement(value: unknown): value is D | SystemElement<D, I> {
    return (
      value !== null &&
      typeof value === "object" &&
      "type" in value &&
      typeof (value as D).type === "string" &&
      "id" in value &&
      typeof (value as D).id === "string"
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
