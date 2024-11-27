import { PatchworkContext, DataType } from "@patchwork/sdk";
import { useContext } from "react";

export const useDataTypes = (): DataType[] => {
  const { builtInDataTypes } = useContext(PatchworkContext);

  return builtInDataTypes;
};
