import { DataType } from "@patchwork/sdk";
import { Icon } from "@patchwork/sdk/ui";

const DataTypeModule: React.FC<{ dataType: DataType }> = ({ dataType }) => (
  <div className="flex items-center gap-2 font-medium mb-2">
    <Icon type="Database" size={14} />
    <span>DataType: {dataType.name}</span>
  </div>
);

export const DataTypesModule: React.FC<{
  dataTypes: DataType[];
}> = ({ dataTypes }) => {
  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-2 font-medium mb-2">
        <Icon type="Wrench" size={14} />
        <span>Tools</span>
      </div>

      <div className="space-y-2">
        {dataTypes.map((dataType, i) => (
          <DataTypeModule key={`datatype-${i}`} dataType={dataType} />
        ))}
      </div>
    </div>
  );
};
