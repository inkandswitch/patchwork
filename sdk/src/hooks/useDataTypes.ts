import { PatchworkContext, DataType } from "..";
import { useContext } from "react";

export const useDataTypes = (): DataType[] => {
  const { builtInDataTypes } = useContext(PatchworkContext);

  return builtInDataTypes;
};
