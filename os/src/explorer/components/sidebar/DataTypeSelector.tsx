import {
  Icon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@patchwork/sdk/ui";
import { DataTypesMap } from "@patchwork/sdk";

interface DataTypeSelectorProps {
  dataTypes: DataTypesMap;
  addNewDocument: (doc: { type: string }) => void;
}

const DataTypeSelector = ({
  dataTypes,
  addNewDocument,
}: DataTypeSelectorProps) => {
  return (
    <Select onValueChange={(value) => addNewDocument({ type: value })}>
      <SelectTrigger className="w-full py-1 px-2 text-sm text-gray-600 hover:bg-gray-200 font-normal border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
        <div className="flex items-center">
          <Icon
            type="Plus"
            size={14}
            className="inline-block font-bold mr-2 align-top mt-[2px]"
          />
          <SelectValue placeholder="Create new..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.values(dataTypes).map((dataType) => {
          if (!dataType.init && dataType.unlisted) return null;

          return (
            <SelectItem
              key={dataType.id}
              value={dataType.id}
              className="py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200"
            >
              <div className="flex items-center">
                <Icon
                  type={dataType.icon}
                  size={14}
                  className="inline-block font-bold mr-2 align-top mt-[2px]"
                />
                New {dataType.name}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default DataTypeSelector;
