import { useEffect, useState } from "react";
import { allDataTypes, datatypeEvents, DataTypesMap } from "../datatypes";

export function useDataTypes() {
  const [datatypes, setDatatypes] = useState<DataTypesMap>(() =>
    allDataTypes()
  );

  useEffect(() => {
    const handler = (newDatatypes: DataTypesMap) => {
      setDatatypes(newDatatypes);
    };

    datatypeEvents.on("datatypes:changed", handler);
    return () => {
      datatypeEvents.off("datatypes:changed", handler);
    };
  }, []);

  return datatypes;
}
