import { useEffect, useState, useCallback } from "react";
import {
  SystemElement,
  getSystemRegistry,
  getElementFromSystem,
  getAllElementsFromSystem,
  hasSystemElement,
  onSystemElementsChange,
  loadElementFromSystem,
  isLoadableElement,
} from "../systems";

/**
 * Hook to get a specific system element by ID
 */
export function useSystemElement<T extends SystemElement>(
  systemType: string,
  id: string | undefined
): T | undefined {
  const [element, setElement] = useState<T | undefined>(
    id ? getElementFromSystem<T>(systemType, id) : undefined
  );

  useEffect(() => {
    if (!id) {
      setElement(undefined);
      return;
    }

    // Set initial state
    setElement(getElementFromSystem<T>(systemType, id));

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onSystemElementsChange<T>(systemType, (elements) => {
        if (elements) {
          setElement(elements[id] as T | undefined);
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to system element changes:`, err);
    }

    // Return a simple function with no properties for cleanup
    return function cleanupSystemElementListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for system element ${id}:`, err);
      }
    };
  }, [systemType, id]);

  return element;
}

/**
 * Hook to get all system elements of a specific type
 */
export function useSystemElements<T extends SystemElement>(
  systemType: string
): Record<string, T> {
  const [elements, setElements] = useState<Record<string, T>>(
    getAllElementsFromSystem<T>(systemType) || {}
  );

  useEffect(() => {
    // Initial fetch
    setElements(getAllElementsFromSystem<T>(systemType) || {});

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onSystemElementsChange<T>(systemType, (newElements) => {
        if (newElements) {
          setElements(newElements);
        } else {
          setElements({});
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to system elements changes:`, err);
    }

    // Return a simple function with no properties for cleanup
    return function cleanupSystemElementsListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for system elements:`, err);
      }
      console.log("cleanupSystemElementsListener");
    };
  }, [systemType]);

  return elements || {};
}

/**
 * Hook to get a filtered list of system elements
 */
export function useFilteredSystemElements<T extends SystemElement>(
  systemType: string,
  filterFn: (element: T) => boolean
): T[] {
  const elements = useSystemElements<T>(systemType);

  const [filteredElements, setFilteredElements] = useState<T[]>(() => {
    // Safely handle the case where elements might be undefined or empty
    if (!elements) return [];
    return Object.values(elements).filter(filterFn) as T[];
  });

  useEffect(() => {
    // Safely handle the case where elements might be undefined or empty
    if (!elements) {
      setFilteredElements([]);
      return;
    }
    setFilteredElements(Object.values(elements).filter(filterFn) as T[]);
  }, [elements, filterFn]);

  return filteredElements;
}

/**
 * Hook to check if a system element exists
 */
export function useHasSystemElement(
  systemType: string,
  id: string | undefined
): boolean {
  const [exists, setExists] = useState<boolean>(
    id ? hasSystemElement(systemType, id) : false
  );

  useEffect(() => {
    if (!id) {
      setExists(false);
      return;
    }

    // Set initial state
    setExists(hasSystemElement(systemType, id));

    // Listen for changes
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onSystemElementsChange(systemType, () => {
        setExists(hasSystemElement(systemType, id));
      });
    } catch (err) {
      console.warn(
        `Error subscribing to system element existence changes:`,
        err
      );
    }

    // Return a simple function with no properties for cleanup
    return function cleanupHasSystemElementListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(`Error during cleanup for has system element ${id}:`, err);
      }
    };
  }, [systemType, id]);

  return exists;
}

/**
 * Hook to get and load a system element by ID.
 * If the element is loadable but not yet loaded, it will load it automatically.
 */
export function useLoadedSystemElement<T extends SystemElement>(
  systemType: string,
  id: string | undefined,
  wait: boolean = false
): {
  element: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const [element, setElement] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const loadElement = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(undefined);

      // Try to get the element normally first
      let systemElement = getElementFromSystem<T>(systemType, id);

      // If not found or is a loadable element, load it
      if (!systemElement || isLoadableElement(systemElement)) {
        systemElement = await loadElementFromSystem<T>(systemType, id, wait);
      }

      setElement(systemElement);
    } catch (err) {
      console.error(`Error loading system element ${id}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [systemType, id, wait]);

  useEffect(() => {
    if (!id) {
      setElement(undefined);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    // Try to load immediately
    loadElement();

    // Listen for changes to the element
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onSystemElementsChange<T>(systemType, (elements) => {
        if (elements && elements[id]) {
          const updatedElement = elements[id];

          // If the element exists but needs loading, load it
          if (isLoadableElement(updatedElement)) {
            loadElement();
          } else {
            // It's already fully loaded
            setElement(updatedElement);
          }
        }
      });
    } catch (err) {
      console.warn(`Error subscribing to system element changes:`, err);
    }

    return function cleanupLoadedSystemElementListener() {
      try {
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (err) {
        console.warn(
          `Error during cleanup for loaded system element ${id}:`,
          err
        );
      }
    };
  }, [systemType, id, loadElement]);

  return { element, isLoading, error };
}

/**
 * Hook to get and load all system elements of a specific type that match a filter.
 * If an element is loadable but not yet loaded, it will load it automatically.
 */
export function useLoadedFilteredSystemElements<
  T extends SystemElement<any, any>
>(
  systemType: string,
  filterFn: (element: T) => boolean,
  wait: boolean = false
): {
  elements: T[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const allElements = useSystemElements<T>(systemType);
  const [loadedElements, setLoadedElements] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const loadElements = async () => {
      if (!allElements || Object.keys(allElements).length === 0) {
        setLoadedElements([]);
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const elements = Object.values(allElements);
        const results: T[] = [];

        // Load each element in parallel
        await Promise.all(
          elements.map(async (element) => {
            try {
              // If it's a loadable element, load it
              let loadedElement: T | undefined = element;
              if (isLoadableElement(element)) {
                const loaded = await loadElementFromSystem<T>(
                  systemType,
                  (element as any).id,
                  wait
                );
                loadedElement = loaded as T;
              }

              // If it matches the filter, include it
              if (loadedElement && filterFn(loadedElement)) {
                results.push(loadedElement);
              }
            } catch (err) {
              console.warn(
                `Error loading element ${(element as any).id}:`,
                err
              );
              // Continue with other elements
            }
          })
        );

        setLoadedElements(results);
      } catch (err) {
        console.error(`Error loading system elements:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadElements();
  }, [systemType, allElements, filterFn, wait]);

  return { elements: loadedElements, isLoading, error };
}
