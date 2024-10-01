import { PatchworkContext } from "@/patchworkContext";
import { DataType } from "@/sdk";
import { useContext } from "react";

export const useDataTypes = (): DataType[] => {
  const { builtInDataTypes } = useContext(PatchworkContext);

  return builtInDataTypes;
};
