import {
  Icon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@patchwork/sdk/ui";
import { DataTypesMap } from "@patchwork/sdk";
import sortBy from "lodash-es/sortBy";

interface DataTypeSelectorProps {
  dataTypes: DataTypesMap;
  addNewDocument: (doc: { type: string }) => void;
}

const DataTypeSelector = ({
  dataTypes,
  addNewDocument,
}: DataTypeSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full py-1 px-2 text-sm text-gray-600 hover:bg-gray-200 font-normal flex items-center">
        <Icon
          type="Plus"
          size={14}
          className="inline-block font-bold mr-2 align-top mt-[2px]"
        />
        Create New
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[180px]">
        {sortBy(Object.values(dataTypes), (dataType) => dataType.name).map(
          (dataType) => {
            if (!dataType.init || dataType.unlisted) return null;

            return (
              <DropdownMenuItem
                key={dataType.id}
                onClick={() => addNewDocument({ type: dataType.id })}
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
              </DropdownMenuItem>
            );
          }
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DataTypeSelector;
