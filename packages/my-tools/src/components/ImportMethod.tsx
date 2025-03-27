import {
  ImportMethod as ImportMethodType,
  getDataTypeDescriptionById,
} from "@patchwork/sdk";
import { Icon } from "@patchwork/sdk/ui";
import React from "react";

export const ImportMethod = ({ method }: { method: ImportMethodType }) => {
  const dataType = getDataTypeDescriptionById(method.datatypeId);
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <div className="flex gap-2 items-center">
        <Icon
          type={dataType?.icon ?? "Package"}
          size={16}
          className="text-gray-500"
        />
        <div className="text-gray-700 font-bold">{method.name}</div>
        {dataType && (
          <div className="text-xs text-gray-400">
            {method.datatypeId === "*"
              ? "All document types"
              : `For ${dataType.name} documents`}
          </div>
        )}
      </div>
      <div className="text-xs mt-2 text-gray-500">
        <div className="font-bold">File extensions:</div>
        {method.fileExtensions.map((ext: string) => (
          <div key={ext} className="inline-block mr-1">
            {ext}
          </div>
        ))}
      </div>
    </div>
  );
};
