import { DataType } from "@patchwork/sdk";
import { Icon } from "@patchwork/sdk/ui";

export const DataTypeModule: React.FC<{ dataType: DataType }> = ({
  dataType,
}) => (
  <div className="border rounded p-3">
    <div className="flex items-center gap-2 font-medium mb-2">
      <Icon type="Database" size={14} />
      <span>DataType: {dataType.name}</span>
    </div>
    <div className="pl-6 text-gray-500">
      {dataType.unixFileExtensions &&
        dataType.unixFileExtensions?.length > 0 && (
          <div>File types: {dataType.unixFileExtensions.join(", ")}</div>
        )}
    </div>
  </div>
);
