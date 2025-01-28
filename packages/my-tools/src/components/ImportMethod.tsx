import { ImportMethod as ImportMethodType, dataTypeById } from "@patchwork/sdk";
import { Icon } from "@patchwork/sdk/ui";

export const ImportMethod: React.FC<{ method: ImportMethodType }> = ({
  method,
}) => {
  const dataType = dataTypeById(method.datatypeId);
  const dataTypeName = dataType?.name ?? method.datatypeId;

  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-2 font-medium mb-2">
        <Icon type="Download" size={14} />
        <span>Import Method: {method.name}</span>
        {method.useAsDefaultMethod && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            Default
          </span>
        )}
      </div>
      <div className="text-sm space-y-1 text-gray-600">
        <div>DataType: {dataTypeName}</div>
        <div>
          File Extensions:{" "}
          {method.fileExtensions.length > 0
            ? method.fileExtensions.join(", ")
            : "none"}
        </div>
      </div>
    </div>
  );
};
