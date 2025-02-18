import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Icon, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@patchwork/sdk/ui";
import sortBy from "lodash-es/sortBy";
const DataTypeSelector = ({ dataTypes, addNewDocument, }) => {
    return (_jsxs(DropdownMenu, { children: [_jsxs(DropdownMenuTrigger, { className: "w-full py-1 px-2 text-sm text-gray-600 hover:bg-gray-200 font-normal flex items-center", children: [_jsx(Icon, { type: "Plus", size: 14, className: "inline-block font-bold mr-2 align-top mt-[2px]" }), "Create New"] }), _jsx(DropdownMenuContent, { className: "min-w-[180px]", children: sortBy(Object.values(dataTypes), (dataType) => dataType.name).map((dataType) => {
                    if (!dataType.init || dataType.unlisted)
                        return null;
                    return (_jsx(DropdownMenuItem, { onClick: () => addNewDocument({ type: dataType.id }), className: "py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Icon, { type: dataType.icon, size: 14, className: "inline-block font-bold mr-2 align-top mt-[2px]" }), "New ", dataType.name] }) }, dataType.id));
                }) })] }));
};
export default DataTypeSelector;
