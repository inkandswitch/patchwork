import { useState, useEffect } from "react";
import { DataType, loadDataTypeById } from "@patchwork/sdk";

/**
 * Hook to load a data type with full implementation
 */
export function useLoadedDataType<D = unknown, T = unknown, V = unknown>(
  id: string | undefined,
  waitForRegistration = true
): {
  dataType: DataType<D, T, V> | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const [dataType, setDataType] = useState<DataType<D, T, V> | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setDataType(undefined);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(undefined);

    loadDataTypeById<D, T, V>(id, waitForRegistration)
      .then((loadedType) => {
        if (isMounted) {
          setDataType(loadedType);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`Error loading data type ${id}:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, waitForRegistration]);

  return { dataType, isLoading, error };
}
